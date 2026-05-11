export default function Spinner({ size = 'sm' }) {
  const dim = size === 'sm' ? 'w-5 h-5' : 'w-8 h-8';
  return (
    <div className={`${dim} border-2 border-indigo-600 border-t-transparent rounded-full animate-spin`} />
  );
}
