interface PriceTextProps {
  price: string | number;
  originalPrice?: string | number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { symbol: 'text-xs', num: 'text-base' },
  md: { symbol: 'text-sm', num: 'text-xl' },
  lg: { symbol: 'text-base', num: 'text-3xl' },
};

export function PriceText({ price, originalPrice, size = 'md' }: PriceTextProps) {
  const s = sizeMap[size];
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className={`text-primary ${s.symbol}`}>¥</span>
      <span className={`font-bold text-primary ${s.num}`}>{price}</span>
      {originalPrice && (
        <span className="text-xs text-text-disabled line-through">
          ¥{originalPrice}
        </span>
      )}
    </span>
  );
}