import { BRAND_LOGO_URL } from '../constants/branding'

/** Innovation Tech logo — one asset in this repo (`public/innovation-tech-logo.svg`), derived from the marketing app. */
export default function LogoMark({ className = '' }) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <img
        src={BRAND_LOGO_URL}
        alt="Innovation Tech"
        className="mx-auto w-full max-h-16 object-contain object-center"
      />
    </div>
  )
}
