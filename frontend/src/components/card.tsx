type CardProps = {
  title: string;
  value: number;
  color: string;
};

export default function Card({ title, value, color }: CardProps) {
  return (
    <div className={`p-5 rounded-xl shadow-md text-white ${color}`}>
      <h2 className="text-sm opacity-80">{title}</h2>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}