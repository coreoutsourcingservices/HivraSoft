import type {
  ReactNode,
} from "react";

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
};

export default function StatCard({
  title,
  value,
  description,
  icon,
}: StatCardProps) {
  return (
    <div
      className="
        rounded-[20px]
        border
        border-[#211A18]/10
        bg-white
        p-5
        shadow-[0_8px_30px_rgba(33,26,24,0.05)]
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div>
          <p
            className="
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.2em]
              text-[#211A18]/45
            "
          >
            {title}
          </p>

          <p
            className="
              mt-3
              text-[28px]
              font-semibold
              text-[#211A18]
            "
          >
            {value}
          </p>
        </div>

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-[13px]
            bg-[#F3E9E4]
            text-[#8C1839]
          "
        >
          {icon}
        </div>
      </div>

      <p
        className="
          mt-4
          text-[10px]
          leading-5
          text-[#211A18]/45
        "
      >
        {description}
      </p>
    </div>
  );
}