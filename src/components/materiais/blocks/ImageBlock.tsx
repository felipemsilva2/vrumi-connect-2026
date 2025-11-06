import type { ImageData } from "@/types/materiais";

interface ImageBlockProps {
  data: ImageData;
}

export const ImageBlock = ({ data }: ImageBlockProps) => {
  return (
    <figure className="my-6">
      <img
        src={data.url}
        alt={data.alt}
        width={data.width}
        height={data.height}
        className="rounded-lg border border-border max-w-full h-auto mx-auto"
        loading="lazy"
      />
      {data.caption && (
        <figcaption className="text-sm text-muted-foreground text-center mt-2">
          {data.caption}
        </figcaption>
      )}
    </figure>
  );
};
