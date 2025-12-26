import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { File, Folder, RefreshCcw } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Spinner } from './ui/spinner'
import { Button } from './ui/button'
import { CheckIcon } from './ui/check'
import { CogIcon } from './ui/cog'
import { CloudUploadIcon } from './ui/cloud-upload'
import type { listDirectory } from '@/lib/scanner'

export const FileTable = ({
  files,
  onClick,
  refresh,
  selected,
  inProgress = [],
  inQueue = [],
  done = [],
}: {
  files: Awaited<ReturnType<typeof listDirectory>>
  onClick: (file: string, action: 'sort' | 'open') => void
  refresh: () => void
  selected?: string
  inProgress?: string[]
  inQueue?: string[]
  done?: string[]
}) => {
  const table = useReactTable({
    data: files,
    getCoreRowModel: getCoreRowModel(),
    columns: [
      {
        id: 'act',
        header: () => (
          <Button variant="ghost" className="cursor-pointer" onClick={refresh}>
            <RefreshCcw />
          </Button>
        ),
        cell: (props) => (
          <Button
            variant="ghost"
            className="cursor-pointer relative"
            onClick={() => onClick(props.row.original.path, 'sort')}
          >
            <CloudUploadIcon />
            {inProgress.includes(props.row.original.path) && (
              <Spinner className="absolute left-0 bottom-0" />
            )}
            {done.includes(props.row.original.path) && (
              <CheckIcon className="absolute right-0 bottom-0" />
            )}
            {inQueue.includes(props.row.original.path) && (
              <CogIcon className="absolute right-0 top-0" />
            )}
          </Button>
        ),
      },
      {
        header: 'Name',
        cell: (props) => (
          <a
            className="cursor-pointer flex gap-2"
            onClick={() => onClick(props.row.original.path, 'open')}
          >
            {props.row.original.type === 'dir' ? <Folder /> : <File />}
            {props.row.original.name}
          </a>
        ),
      },
    ],
  })
  return (
    <Table className="h-full block rounded-md border">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={selected === row.original.path && 'selected'}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={1} className="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
