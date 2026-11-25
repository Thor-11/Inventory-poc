import { Autocomplete, TextField } from '@mui/material';

/** Searchable product dropdown used by the stock forms and filters. */
export default function ProductPicker({
  value, onChange, options, label = 'Product', required = true, error, helperText, disabled,
}) {
  const selected = options.find((p) => p.id === value) || null;
  return (
    <Autocomplete
      options={options}
      value={selected}
      disabled={disabled}
      onChange={(_, v) => onChange(v ? v.id : '')}
      getOptionLabel={(o) => `${o.code} — ${o.name}`}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      noOptionsText="No matching products"
      renderInput={(params) => (
        <TextField {...params} label={label} required={required} error={Boolean(error)} helperText={helperText} />
      )}
    />
  );
}
