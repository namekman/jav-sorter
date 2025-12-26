import { List } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import type { Metadata } from '@/model/Metadata'
import type { ScanResult } from '@/lib/scanner'

export const MetadataChooserDialog = ({
  data,
  onSubmit,
}: {
  data: ScanResult
  onSubmit: (metadata: Metadata) => void
}) => {
  const [selected, setSelected] = useState('0')
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <List />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Metadata</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Label>Source</Label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.metadatas.map((val, idx) => (
                <SelectItem key={idx} value={`${idx}`}>
                  {val.metadata.id} ({val.sourceProvider})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              onClick={() => onSubmit(data.metadatas[+selected].metadata)}
            >
              Save
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
