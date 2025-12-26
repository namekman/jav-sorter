import { createFileRoute } from '@tanstack/react-router'
import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useAsyncQueuer } from '@tanstack/react-pacer'
import { ChevronLeft, ChevronRight, Trash } from 'lucide-react'
import { isNil, merge, sortBy } from 'lodash-es'
import type { ScanResult } from '@/lib/scanner'
import { FileTable } from '@/components/FileTable'
import { listScans, scanFile } from '@/server/sorter'
import { listDirectory } from '@/lib/scanner'
import { MetadataForm } from '@/components/MetadataForm'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MetadataChooserDialog } from '@/components/MetadataChooserDialog'
import { Button } from '@/components/ui/button'
import { Delayer } from '@/components/Delayer'
import { getConfig } from '@/server/config'
import { removeScanFn } from '@/lib/sort'

const listDirectoryQuery = (dir: string) =>
  queryOptions({
    queryKey: ['dir', dir],
    queryFn: ({ queryKey }) => listDirectory({ data: queryKey[1] }),
  })

const getConfigQuery = queryOptions({
  queryKey: ['config'],
  queryFn: getConfig,
})

const getAllScans = queryOptions({
  queryKey: ['scans'],
  queryFn: listScans,
})

export const Route = createFileRoute('/')({
  component: Sort,
  loader: async ({ context }) => {
    const config = await context.queryClient.ensureQueryData(getConfigQuery)
    const scans = await context.queryClient.fetchQuery(getAllScans)
    return { config, scans }
  },
})

export function Sort() {
  const { config, scans } = Route.useLoaderData()
  const [data, setData] = useState<ScanResult[]>(scans)
  const [selected, setSelected] = useState<number>()
  const {
    data: files,
    refetch,
    isLoading,
  } = useQuery(listDirectoryQuery(config.sourceDir))
  const { mutateAsync, isPending } = useMutation(
    mutationOptions({
      mutationFn: (d: string) => scanFile({ data: d }),
      retryDelay: 10000,
      retry: (count) => count < 2,
      onSuccess: (res) =>
        setData(
          sortBy([...data.filter((d) => d.path !== res.path), res], (s) =>
            s.path.toLowerCase(),
          ),
        ),
    }),
  )
  const queuer = useAsyncQueuer<string>(
    mutateAsync,
    { concurrency: 1 },
    ({ items, activeItems }) => ({
      items,
      activeItems,
      pendingItems: items.filter((i) => !activeItems.includes(i)),
    }),
  )
  const { activeItems, pendingItems } = queuer.state
  const inMemory = useMemo(() => data.map((d) => d.path), [data])

  useEffect(() => {
    if (!isNil(selected) && !data[selected]) {
      setSelected(data.length ? data.length - 1 : undefined)
    } else if (!selected && data.length) {
      setSelected(0)
    }
  }, [data, selected])

  const selectedData = useMemo(
    () => (isNil(selected) ? undefined : data[selected]),
    [data, selected],
  )
  return (
    <div className="grid grid-cols-[300px_1fr] gap-2 h-[calc(100vh-96px)]">
      <div className="w-full flex flex-col gap-2">
        <div className="grid grid-cols-[30px_150px_30px_30px_30px] gap-2">
          <Button
            className="cursor-pointer"
            variant="ghost"
            disabled={!selected}
            onClick={() => {
              setSelected((s) => (s ?? 0) - 1)
            }}
          >
            <ChevronLeft />
          </Button>
          <Select
            value={`${selected}`}
            onValueChange={(val) => setSelected(isNil(val) ? undefined : +val)}
          >
            <SelectTrigger className="w-full overflow-hidden">
              <SelectValue />
              {isPending && <Spinner />}
            </SelectTrigger>
            <SelectContent>
              {data.map((val, idx) => (
                <SelectItem key={val.path} value={`${idx}`}>
                  {val.path.split(/[\\/]/).slice(-1)[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="cursor-pointer"
            variant="ghost"
            disabled={isNil(selected) || selected === data.length - 1}
            onClick={() => {
              setSelected((s) => (s ?? 0) + 1)
            }}
          >
            <ChevronRight />
          </Button>
          {!isNil(selected) && selectedData && (
            <MetadataChooserDialog
              data={selectedData}
              onSubmit={(metadata) => {
                setData((d) => [
                  ...d.slice(0, selected),
                  {
                    ...selectedData,
                    currentMetadata: merge(
                      selectedData.currentMetadata,
                      metadata,
                    ),
                  },
                  ...d.slice(selected + 1),
                ])
              }}
            />
          )}
          {!isNil(selected) && (
            <Button
              className="cursor-pointer"
              onClick={() => {
                setData((d) => [
                  ...d.slice(0, selected),
                  ...d.slice(selected + 1),
                ])
                selectedData && removeScanFn({ data: selectedData.path })
              }}
            >
              <Trash />
            </Button>
          )}
        </div>
        {isLoading ? (
          <Spinner />
        ) : (
          <FileTable
            files={files ?? []}
            refresh={refetch}
            onClick={(item, action) => {
              if (action === 'sort') {
                if (!queuer.peekAllItems().includes(item)) {
                  queuer.addItem(item)
                }
              } else {
                const idx = data.findIndex(({ path }) => path === item)
                if (idx !== -1) {
                  setSelected(idx)
                }
              }
            }}
            selected={selectedData?.path}
            inProgress={activeItems}
            inQueue={pendingItems}
            done={inMemory}
          />
        )}
      </div>
      <div>
        {selectedData && (
          <Delayer data={selectedData}>
            <MetadataForm
              media={selectedData}
              outDir={
                selectedData.currentMetadata.type === 'fc2'
                  ? config.fc2TargetDir
                  : config.targetDir
              }
              onSuccess={(mediaPath) => {
                refetch()
                setData(data.filter(({ path }) => path !== mediaPath))
              }}
            />
          </Delayer>
        )}
      </div>
    </div>
  )
}
