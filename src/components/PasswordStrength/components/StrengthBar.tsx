interface Props {
  strength: number;
}

const arr = new Array(5).fill(0).map((_, index) => index + 1);

function StrengthBar(props: Props) {
  const { strength } = props;

  return (
    <div className="flex items-center">
      {arr.map((item) => (
        <div
          key={item}
          className={`
            w-19%
            h-5px
            mt-5px
            mr-1%
            rounded-10px
            bg-light-900
            ${item <= strength && strength > 3 ? '!bg-green-400' : ''}
            ${item <= strength && strength === 3 ? '!bg-yellow-400' : ''}
            ${item <= strength && strength < 3 ? '!bg-red-400' : ''}
          `}
        ></div>
      ))}
    </div>
  );
}

export default StrengthBar;
