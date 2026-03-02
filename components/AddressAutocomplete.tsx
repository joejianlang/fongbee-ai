'use client';

import { useEffect, useRef, useCallback } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

export interface AddressDetails {
  fullAddress: string;   // 完整格式化地址
  streetNumber: string;
  route: string;         // 街道名
  city: string;
  province: string;      // 省份缩写 e.g. "ON"
  postalCode: string;    // e.g. "N1G 1Y1"
  lat?: number;
  lng?: number;
}

interface Props {
  value: string;
  onChange: (address: string, details?: AddressDetails) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

/** Parse a PlaceResult address_components array into structured fields */
function parseComponents(
  components: google.maps.GeocoderAddressComponent[],
): Omit<AddressDetails, 'fullAddress' | 'lat' | 'lng'> {
  const get = (type: string, short = false) => {
    const c = components.find((x) => x.types.includes(type));
    return c ? (short ? c.short_name : c.long_name) : '';
  };

  return {
    streetNumber: get('street_number'),
    route: get('route'),
    // "locality" covers most cities; fall back to sublocality or admin_area_2
    city:
      get('locality') ||
      get('sublocality_level_1') ||
      get('administrative_area_level_2'),
    // Province short name e.g. "ON", "BC"
    province: get('administrative_area_level_1', true),
    postalCode: get('postal_code'),
  };
}

let optionsSet = false;

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = '请输入地址',
  required = false,
  className = '',
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const initAutocomplete = useCallback(async () => {
    if (!inputRef.current || autocompleteRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return; // degrade to plain text input when key is absent

    try {
      // setOptions must be called before importLibrary; guard against multiple calls
      if (!optionsSet) {
        setOptions({ key: apiKey, libraries: ['places'] });
        optionsSet = true;
      }

      const { Autocomplete } = await importLibrary('places') as google.maps.PlacesLibrary;

      const ac = new Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'ca' },
        fields: ['address_components', 'formatted_address', 'geometry'],
        types: ['address'],
      });

      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place.address_components) return;

        const parts = parseComponents(place.address_components);
        const details: AddressDetails = {
          fullAddress: place.formatted_address ?? inputRef.current?.value ?? '',
          ...parts,
          lat: place.geometry?.location?.lat(),
          lng: place.geometry?.location?.lng(),
        };

        onChange(details.fullAddress, details);
      });

      autocompleteRef.current = ac;
    } catch {
      // API key missing / network error — degrade to plain text input
    }
  }, [onChange]);

  useEffect(() => {
    initAutocomplete();
  }, [initAutocomplete]);

  // Sync manual typing (no place selected from dropdown)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, undefined);
  };

  return (
    <>
      {/* Fix Google Autocomplete dropdown z-index so it appears above sticky bars */}
      <style>{`.pac-container { z-index: 9999 !important; }`}</style>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        className={className}
      />
    </>
  );
}
