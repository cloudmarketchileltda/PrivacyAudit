import { Field } from '@/components/forms';
import { generalConfig } from '@/config/general';

export type AccountContact = { address: string; phone: string; city: string; country: string };
export function ContactFields({ contact }: { contact?: AccountContact }) {
  return (
    <>
      <Field
        label="Dirección"
        name="address"
        defaultValue={contact?.address}
        autoComplete="street-address"
        maxLength={generalConfig.account.contactMaxLengths.address}
      />
      <Field
        label="Teléfono"
        name="phone"
        type="tel"
        defaultValue={contact?.phone}
        autoComplete="tel"
        maxLength={generalConfig.account.contactMaxLengths.phone}
      />
      <Field
        label="Ciudad"
        name="city"
        defaultValue={contact?.city}
        autoComplete="address-level2"
        maxLength={generalConfig.account.contactMaxLengths.city}
      />
      <Field
        label="País"
        name="country"
        defaultValue={contact?.country}
        autoComplete="country-name"
        maxLength={generalConfig.account.contactMaxLengths.country}
      />
    </>
  );
}
