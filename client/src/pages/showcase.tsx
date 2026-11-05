import type { ReactNode } from "react";
import { getShowcase, type PortfolioEntry, type Showcase } from "../api";
import { mediaUrl } from "../serverUrl";
import { useQuery } from "../useQuery";

function monthLabel(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const [year, month] = value.slice(0, 10).split("-");
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  if (!year || !month || Number.isNaN(yearNumber) || Number.isNaN(monthNumber)) {
    return value;
  }
  return new Date(Date.UTC(yearNumber, monthNumber - 1, 1)).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function dateLine(entry: PortfolioEntry, currentLabel: boolean): string {
  const start = monthLabel(entry.startedOn);
  const end = monthLabel(entry.endedOn) ?? (currentLabel && start ? "Present" : null);
  return [start, end].filter((part) => part).join(" – ");
}

function ShowcaseGate({
  children,
}: {
  children: (showcase: Showcase) => ReactNode;
}) {
  const query = useQuery(getShowcase);
  if (query.status === "loading") {
    return <p>Loading...</p>;
  }
  if (query.status === "error") {
    return <p>Could not load the portfolio. {query.message}</p>;
  }
  return children(query.data);
}

function EntryCard({
  entry,
  currentLabel,
  tallImage,
}: {
  entry: PortfolioEntry;
  currentLabel: boolean;
  tallImage?: boolean;
}) {
  const dates = dateLine(entry, currentLabel);
  return (
    <article className="entry-card">
      {entry.imagePath ? (
        <img className={tallImage ? "degree-image" : undefined} src={mediaUrl(entry.imagePath)} alt="" />
      ) : null}
      <div className="entry-body">
        <h2>{entry.title}</h2>
        {entry.subtitle || dates ? (
          <p className="meta">{[entry.subtitle, dates].filter(Boolean).join(" · ")}</p>
        ) : null}
        {entry.shortDescription ? <p>{entry.shortDescription}</p> : null}
        {entry.longDescription && entry.longDescription !== entry.shortDescription ? (
          <p className="long-copy">
            {entry.longDescription.startsWith(entry.shortDescription)
              ? entry.longDescription.slice(entry.shortDescription.length).trim()
              : entry.longDescription}
          </p>
        ) : null}
        {entry.skills && entry.skills.length > 0 ? (
          <ul className="chips">
            {entry.skills.map((skill) => (
              <li key={skill.id}>{skill.name}</li>
            ))}
          </ul>
        ) : null}
        {entry.linkUrl ? (
          <p>
            <a href={entry.linkUrl}>Open link</a>
          </p>
        ) : null}
      </div>
    </article>
  );
}

function EntryList({
  title,
  description,
  entries,
  currentLabel,
  tallImage,
}: {
  title: string;
  description: string;
  entries: PortfolioEntry[];
  currentLabel: boolean;
  tallImage?: boolean;
}) {
  return (
    <>
      <h1>{title}</h1>
      <p className="lede">{description}</p>
      {entries.length === 0 ? <p>Nothing here yet.</p> : null}
      <div className="entry-list">
        {entries.map((entry) => (
          <EntryCard key={entry.slug} entry={entry} currentLabel={currentLabel} tallImage={tallImage} />
        ))}
      </div>
    </>
  );
}

export function HomePage() {
  return (
    <ShowcaseGate>
      {(showcase) => {
        const profile = showcase.profile;
        const paragraphs = profile.notes.split("\n\n").filter((paragraph) => paragraph.trim().length > 0);
        const lede = paragraphs[0] ?? "";
        const about = paragraphs.slice(1);
        return (
          <>
            <section className="hero">
              {profile.photoPath ? <img className="portrait" src={mediaUrl(profile.photoPath)} alt="" /> : null}
              <div>
                {profile.languages.length > 0 ? <p className="eyebrow">{profile.languages.join(" · ")}</p> : null}
                <h1>{profile.name}</h1>
                {lede ? <p className="lede">{lede}</p> : null}
                <p className="meta">{[profile.phone, profile.email].filter(Boolean).join(" · ")}</p>
              </div>
            </section>
            {about.length > 0 ? (
              <section className="about">
                <h2>About</h2>
                {about.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ) : null}
            {showcase.skills.length > 0 ? (
              <section>
                <h2>Skills</h2>
                <ul className="chips">
                  {showcase.skills.map((skill) => (
                    <li key={skill.id}>{skill.name}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {showcase.references.length > 0 ? (
              <section>
                <h2>References</h2>
                <div className="entry-list">
                  {showcase.references.map((reference) => (
                    <article className="entry-card" key={reference.id}>
                      <div className="entry-body">
                        <h2>
                          {reference.firstName} {reference.lastName}
                        </h2>
                        <p className="meta">{reference.email}</p>
                        <p>{reference.shortDescription}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        );
      }}
    </ShowcaseGate>
  );
}

export function ExperiencePage() {
  return (
    <ShowcaseGate>
      {(showcase) => (
        <EntryList
          title="Experience"
          description="Roles and work so far."
          entries={showcase.entries.experience}
          currentLabel
        />
      )}
    </ShowcaseGate>
  );
}

export function EducationPage() {
  return (
    <ShowcaseGate>
      {(showcase) => (
        <>
          <EntryList
            title="Education"
            description="Schools and degrees."
            entries={showcase.entries.education}
            currentLabel={false}
            tallImage
          />
          {showcase.entries.coursework.length > 0 ? (
            <section className="about">
              <h2>Coursework</h2>
              <div className="entry-list">
                {showcase.entries.coursework.map((entry) => (
                  <EntryCard key={entry.slug} entry={entry} currentLabel={false} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </ShowcaseGate>
  );
}

export function ProjectsPage() {
  return (
    <ShowcaseGate>
      {(showcase) => (
        <EntryList
          title="Projects"
          description="Things I have built."
          entries={showcase.entries.project}
          currentLabel
        />
      )}
    </ShowcaseGate>
  );
}

export function CertificationsPage() {
  return (
    <ShowcaseGate>
      {(showcase) => (
        <EntryList
          title="Certifications"
          description="Courses and credentials."
          entries={showcase.entries.certificate}
          currentLabel={false}
        />
      )}
    </ShowcaseGate>
  );
}
