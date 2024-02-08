import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";

export async function loader({ params }) {
  const noteResponse = await fetch(
    process.env.API_URL +
      "/contacts/" +
      params.contactId +
      "/notes/" +
      params.noteIndex,
  );

  if (!noteResponse.ok) {
    const error = await noteResponse.json();
    throw new Response(error.message, { status: noteResponse.status });
  }

  const note = await noteResponse.json();

  return json({ note });
}

export default function Note() {
  const { note } = useLoaderData();
  const navigate = useNavigate();

  return (
    <div id="note-details" className="basis-1/4">
      <p className="rounded border border-gray-200 p-3">{note.note}</p>
      <button
        className="mt-4"
        onClick={() => {
          navigate("..");
        }}
      >
        Close
      </button>
    </div>
  );
}
