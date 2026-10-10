import Image from 'next/image';
import { generalConfig } from '@/config/general';

export function BrandLogo() {
  return (
    <Image
      src={generalConfig.site.brand.logo}
      alt={generalConfig.site.brand.name}
      width={500}
      height={500}
      className="brand-logo"
      priority
    />
  );
}
