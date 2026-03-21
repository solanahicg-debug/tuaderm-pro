type Props = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const ExcelInput = ({ label, value, onChange }: Props) => {
  return (
    <div>
      <label className="text-xs uppercase text-gray-400">{label}</label>
      <input
        className="excel-input"
        value={value}
        onChange={onChange}
      />
    </div>
  );
};