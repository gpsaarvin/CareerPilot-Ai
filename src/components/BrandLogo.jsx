import Image from 'next/image';

export default function BrandLogo({ size = 36 }) {
  return (
    <div
      className="rounded-xl overflow-hidden ring-1 ring-black/10 shadow-sm bg-white"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src="/company-logo.svg"
        alt="Company logo"
        width={size}
        height={size}
        className="w-full h-full object-cover"
        priority
      />
    </div>
  );
}
