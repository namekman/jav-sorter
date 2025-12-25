import { sortFileFn, updateDraftFn } from '@/lib/sort'
import { Media } from '@/model/Media'
import { Metadata } from '@/model/Metadata'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Plus, Trash } from 'lucide-react'
import { useAppForm } from '@/hooks/sort.form'
import { Button } from './ui/button'
import { ActressChooserDialog } from './ActressChooserDialog'

export const MetadataForm = ({
  media,
  outDir,
  onSuccess,
}: {
  media: Media
  outDir: string
  onSuccess?: (path: string) => void
}) => {
  const { mutateAsync: sort } = useMutation(
    mutationOptions({
      mutationKey: ['sort', media.path],
      mutationFn: (currentMetadata: Metadata) =>
        sortFileFn({ data: { media: { ...media, currentMetadata }, outDir } }),
      onSuccess: () => onSuccess?.(media.path),
    }),
  )
  const { mutateAsync: updateDraft } = useMutation(
    mutationOptions({
      mutationFn: (data: { currentMetadata: Metadata; media: Media }) =>
        updateDraftFn({
          data: {
            currentMetadata: data.currentMetadata,
            path: data.media.path,
          },
        }),
      onSuccess: (_, data) => {
        data.media.currentMetadata = data.currentMetadata
      },
    }),
  )
  const form = useAppForm({
    defaultValues: media.currentMetadata,
    onSubmit: ({ value }) => sort(value),
    listeners: {
      onBlur: ({ formApi }) =>
        updateDraft({ currentMetadata: formApi.baseStore.state.values, media }),
    },
  })

  useEffect(() => {
    form.reset(media.currentMetadata)
  }, [media.currentMetadata])

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        await form.handleSubmit()
      }}
    >
      <div className="grid grid-cols-2">
        <div>
          <div className="flex gap-2">
            <div className="my-auto">{media.path}</div>
            <form.AppForm>
              <form.SubscribeButton label="Sort" />
            </form.AppForm>
          </div>
          <div className="flex gap-2">
            <form.AppField name="id">
              {(field) => <field.TextField label="Id" />}
            </form.AppField>
            <form.AppField name="contentId">
              {(field) => <field.TextField label="Content Id" />}
            </form.AppField>
            <form.AppField name="releaseDate">
              {(field) => <field.DateField label="Release" />}
            </form.AppField>
            <form.AppField name="runTime">
              {(field) => <field.TextField label="Runtime" />}
            </form.AppField>
          </div>
          <form.AppField name="title">
            {(field) => <field.TextField label="Title" />}
          </form.AppField>
          <div className="grid grid-cols-2 gap-2">
            <form.AppField name="director">
              {(field) => <field.TextField label="Director" />}
            </form.AppField>
            <form.AppField name="series">
              {(field) => <field.TextField label="Series" />}
            </form.AppField>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <form.AppField name="maker">
              {(field) => <field.TextField label="Maker" />}
            </form.AppField>
            <form.AppField name="label">
              {(field) => <field.TextField label="Label" />}
            </form.AppField>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <form.AppField name="rating">
              {(field) => <field.TextField label="Rating" />}
            </form.AppField>
            <form.AppField name="votes">
              {(field) => <field.TextField label="Votes" />}
            </form.AppField>
          </div>
        </div>
        {form.state.values?.cover && (
          <img className="mx-auto h-100" src={form.state.values.cover} />
        )}
      </div>
      <form.AppField name="description">
        {(field) => <field.TextField label="Description" />}
      </form.AppField>
      <form.AppField name="genres">
        {(field) => <field.TagListField label="Genres" />}
      </form.AppField>
      <form.AppField name="tags">
        {(field) => <field.TagListField label="Tags" />}
      </form.AppField>
      <form.AppField name="cover">
        {(field) => <field.TextField label="Cover" />}
      </form.AppField>
      <form.AppField name="screenshots">
        {(field) => <field.TagListField label="Screenshots" />}
      </form.AppField>
      <form.AppField name="trailer">
        {(field) => <field.TextField label="Trailer" />}
      </form.AppField>
      <form.Field name="actors" mode="array">
        {(field) => (
          <div className="flex gap-2">
            {field.state.value?.map((actor, idx) => (
              <div
                key={idx}
                className="items-center w-[230px] content-center flex flex-col relative p-4"
              >
                <div className="absolute top-3 left-3">
                  <ActressChooserDialog
                    onSubmit={(actress) =>
                      field.setValue((arr) =>
                        arr!.map((v, arrIdx) =>
                          idx === arrIdx ? { ...actress } : v,
                        ),
                      )
                    }
                  />
                </div>
                <div className="absolute top-3 right-3">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      field.removeValue(idx)
                    }}
                  >
                    <Trash className="cursor-pointer" />
                  </Button>
                </div>
                <div className="w-[calc(100%-45px)]">
                  <form.AppField name={`actors[${idx}].enName`}>
                    {(field) => <field.TextField />}
                  </form.AppField>
                  <form.AppField name={`actors[${idx}].jpName`}>
                    {(field) => <field.TextField />}
                  </form.AppField>
                  <form.AppField name={`actors[${idx}].thumbnail`}>
                    {(field) => <field.TextField />}
                  </form.AppField>
                  {actor.thumbnail && (
                    <div className="items-center flex max-w-[200px] max-h-[200px] overflow-hidden rounded-2xl">
                      <img
                        src={actor.thumbnail}
                        className="h-[200px] object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <Button
              className="mt-4"
              type="button"
              onClick={() => field.pushValue({ enName: '', jpName: '' })}
            >
              <Plus />
            </Button>
          </div>
        )}
      </form.Field>
    </form>
  )
}
