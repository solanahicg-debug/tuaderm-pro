type Props = {
  label: string;
  isActive: boolean;
  onClick: () => void;
};

export const BadgeButton = ({ label, isActive, onClick }: Props) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-bold border ${
        isActive
          ? "bg-[#8e7b8d] text-white"
          : "bg-white text-gray-600"
      }`}
    >
      {label}
    </button>
  );
};