import styles from './QrCode.module.css'

export default function QrCode({ src, target }: { src?: string; target: string }) {
  if (!src) return null
  return (
    <div className={styles.wrap}>
      <img className={styles.qr} src={src} alt={`QR code linking to ${target}`} width={120} height={120} />
      <span className={styles.cap}>scan / {prettyTarget(target)}</span>
    </div>
  )
}

function prettyTarget(t: string) {
  return t.replace(/^https?:\/\//, '').replace(/\/$/, '')
}
