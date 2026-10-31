import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENTS, eventById } from "@/lib/data";
import EventDetailClient from "./EventDetailClient";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ id: e.id }));
}

export function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return params.then(({ id }) => {
    const e = eventById[id];
    if (!e) return { title: "Event not found" };
    return {
      title: `${e.name} — Seasonal Intelligence`,
      description: `${e.description} Creation windows, submission deadlines, asset recommendations and keyword ideas for Adobe Stock contributors.`,
      openGraph: {
        title: `${e.name} · StockSeason Intelligence`,
        description: e.description,
      },
    };
  });
}

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    if (!eventById[id]) notFound();
    return <EventDetailClient id={id} />;
  });
}
