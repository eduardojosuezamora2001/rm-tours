import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImagePlus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import './image-upload.css'

function UploadPreview({ file }: { file: File }) {
  const preview = useCallback((node: HTMLImageElement | null) => {
    if (!node) return
    const url = URL.createObjectURL(file)
    node.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])
  return <img ref={preview} alt="" width="96" height="72" />
}

export function ImageUpload({ busy, full, onUpload }: {
  busy: boolean
  full: boolean
  onUpload: (file: File) => Promise<void>
}) {
  const { t } = useTranslation('admin', { lng: 'es' })
  const input = useRef<HTMLInputElement>(null)
  const depth = useRef(0)
  const processing = useRef(false)
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState<File | null>(null)
  const disabled = busy || full

  async function submit(file?: File) {
    if (!file || disabled || processing.current) return
    processing.current = true
    setDragging(false)
    setSelected(file)
    try {
      await onUpload(file)
    } finally {
      setSelected(null)
      processing.current = false
    }
  }

  return (
    <Field>
      <FieldLabel htmlFor="image-upload">{t('upload')}</FieldLabel>
      <div
        className={cn('image-dropzone', dragging && 'image-dropzone-active')}
        role="region"
        aria-label={t('upload')}
        aria-busy={busy}
        aria-disabled={disabled}
        onDragEnter={(event) => {
          if (!event.dataTransfer.types.includes('Files')) return
          event.preventDefault()
          depth.current++
          if (!disabled) setDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          event.dataTransfer.dropEffect = disabled ? 'none' : 'copy'
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          depth.current = Math.max(0, depth.current - 1)
          if (!depth.current) setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          depth.current = 0
          setDragging(false)
          void submit(event.dataTransfer.files[0])
        }}
      >
        <div className="image-dropzone-icon" aria-hidden="true"><ImagePlus /></div>
        <div className="image-dropzone-copy" aria-live="polite">
          <strong>{full ? t('uploadLimit') : busy ? t('uploadWorking') : dragging ? t('uploadDrop') : t('uploadDrag')}</strong>
          <p>{t('uploadFormats')}</p>
        </div>
        <Button type="button" variant="outline" disabled={disabled} onClick={() => input.current?.click()}>
          {busy ? <Spinner data-icon="inline-start" /> : <Upload data-icon="inline-start" />}
          {busy ? t('uploading') : t('uploadChoose')}
        </Button>
        <Input
          ref={input}
          id="image-upload"
          className="hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          onChange={(event) => {
            void submit(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        {selected && busy && (
          <div className="image-upload-preview" role="status">
            {['image/jpeg', 'image/png', 'image/webp'].includes(selected.type) && <UploadPreview file={selected} />}
            <div><strong>{selected.name}</strong><span>{(selected.size / 1024 / 1024).toFixed(2)} MB · {t('uploadWorking')}</span></div>
          </div>
        )}
      </div>
      <FieldDescription>{t('uploadNext')}</FieldDescription>
      <FieldDescription>{t('mediaConvention')}</FieldDescription>
    </Field>
  )
}
