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
import { Search } from 'lucide-react'
import { useState } from 'react'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { fetchActressFn } from '@/server/actress'
import { Actor } from '@/model/Actor'
import { Combobox } from './ComboBox'

const actressQuery = (query: string) =>
  queryOptions({
    queryKey: ['actresses', query],
    queryFn: ({ queryKey }) => fetchActressFn({ data: queryKey[1] }),
  })

export const ActressChooserDialog = ({
  onSubmit,
}: {
  onSubmit: (actress: Actor) => void
}) => {
  const [selected, setSelected] = useState<Actor>()
  const [state, setState] = useState('')
  const { data } = useQuery(actressQuery(state))
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="cursor-pointer" type="button" variant="ghost">
          <Search />
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-2xl max-w-full w-fit">
        <DialogHeader>
          <DialogTitle>Select Actress</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Label>Actress</Label>
          <Combobox
            className="w-full max"
            items={(data ?? [])?.map((actress) => ({
              value: actress.jpName,
              label: `${actress.enName} - ${actress.jpName} (${actress.aliases?.filter((a) => a !== actress.jpName).join(', ')})`,
            }))}
            onSelect={(value) =>
              setSelected(data?.find((d) => d.jpName === value))
            }
            onSearchChange={setState}
            value={selected?.jpName ?? ''}
          />
          {selected?.thumbnail && <img src={selected.thumbnail} />}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              type="button"
              disabled={!selected}
              onClick={() => onSubmit(selected!)}
            >
              Save
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
