import type { TeamData } from "../types/content";
import { EditableText } from "../editors/EditableText";
import { EditableImage } from "../editors/EditableImage";
import { EditableRichText } from "../editors/EditableRichText";

type Props = { data: TeamData; pathPrefix: string };

export function TeamBlock({ data, pathPrefix }: Props) {
  return (
    <section id="team" className="bg-slate-50 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <EditableText
            path={`${pathPrefix}.title`}
            value={data.title}
            as="h2"
            className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900"
          />
          <EditableRichText
            path={`${pathPrefix}.subtitle`}
            value={data.subtitle}
            as="div"
            className="mt-4 text-lg text-slate-600"
          />
        </div>

        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {data.members.map((m, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <EditableImage
                path={`${pathPrefix}.members.${i}.image`}
                src={m.image}
                alt={m.name}
                rounded="full"
                className="h-32 w-32 object-cover bg-slate-200"
              />
              <EditableText
                path={`${pathPrefix}.members.${i}.name`}
                value={m.name}
                as="h3"
                className="mt-6 text-lg font-semibold text-slate-900"
              />
              <EditableText
                path={`${pathPrefix}.members.${i}.role`}
                value={m.role}
                as="p"
                className="mt-1 text-sm font-medium text-blue-600"
              />
              <EditableRichText
                path={`${pathPrefix}.members.${i}.bio`}
                value={m.bio}
                as="div"
                className="mt-3 max-w-xs text-slate-600 leading-relaxed"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
