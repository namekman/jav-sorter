import { createFileRoute } from '@tanstack/react-router'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Trash } from 'lucide-react'
import { isNil, merge } from 'lodash-es'
import { FileTable } from '@/components/FileTable'
import { listFiles } from '@/server/sorter'
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
import { getConfigFn } from '@/server/config'
import { useScanContext } from '@/contexts/ScanContext'

const listDirectoryQuery = (dir: string) =>
  queryOptions({
    queryKey: ['dir', dir],
    queryFn: ({ queryKey }) => listFiles({ data: queryKey[1] }),
  })

const getConfigQuery = queryOptions({
  queryKey: ['config'],
  queryFn: getConfigFn,
})

export const Route = createFileRoute('/')({
  component: Sort,
  loader: async ({ context }) => {
    const config = await context.queryClient.ensureQueryData(getConfigQuery)
    return { config }
  },
})

export function Sort() {
  const { config } = Route.useLoaderData()
  const { scans, status, queue, remove, update, scan } = useScanContext()
  const [selected, setSelected] = useState<number>()
  const {
    data: files,
    refetch,
    isLoading,
  } = useQuery(listDirectoryQuery(config.sourceDir))

  useEffect(() => {
    if (!isNil(selected) && !scans[selected]) {
      setSelected(scans.length ? scans.length - 1 : undefined)
    } else if (!selected && scans.length) {
      setSelected(0)
    }
  }, [scans, selected])

  useEffect(() => {
    if (!status?.inProgress) {
      refetch()
    }
  }, [status])

  const selectedData = useMemo(
    () => (isNil(selected) ? undefined : scans[selected]),
    [scans, selected],
  )
  return (
    <div className="grid grid-cols-[300px_1fr] gap-2 h-full">
      <div className="w-full flex flex-col gap-2 max-h-192">
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
              {status?.inProgress && <Spinner />}
            </SelectTrigger>
            <SelectContent>
              {scans.map((val, idx) => (
                <SelectItem key={val.path} value={`${idx}`}>
                  {val.path.split(/[\\/]/).slice(-1)[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="cursor-pointer"
            variant="ghost"
            disabled={isNil(selected) || selected === scans.length - 1}
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
                update({
                  path: selectedData.path,
                  currentMetadata: merge(
                    selectedData.currentMetadata,
                    metadata,
                  ),
                  reload: true,
                })
              }}
            />
          )}
          {!isNil(selected) && (
            <Button
              className="cursor-pointer"
              onClick={() => {
                selectedData && remove(selectedData.path)
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
                scan(item)
              } else {
                const idx = scans.findIndex(({ path }) => path === item)
                if (idx !== -1) {
                  setSelected(idx)
                }
              }
            }}
            selected={selectedData?.path}
            inProgress={queue.slice(0, 1).map((q) => q.path)}
            inQueue={queue
              .slice(1)
              .filter((t) => t.type === 'scan')
              .map((t) => t.path)}
            done={scans.map((s) => s.path)}
          />
        )}
      </div>
      <div>
        {selectedData && (
          <Delayer data={selectedData}>
            <MetadataForm media={selectedData} />
          </Delayer>
        )}
      </div>
    </div>
  )
}
