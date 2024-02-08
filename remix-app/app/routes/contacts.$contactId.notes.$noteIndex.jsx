import { json } from "@remix-run/node";
import {
  isRouteErrorResponse,
  useLoaderData,
  useNavigate,
  useRouteError,
} from "@remix-run/react";
import ErrorMessage from "~/components/ErrorMessage";

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

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <ErrorMessage
        title={error.status + " " + error.statusText}
        message={error.data}
        className="basis-1/4"
      />
    );
  } else if (error instanceof Error) {
    return (
      <ErrorMessage
        title={error.message}
        message={error.stack}
        className="basis-1/4"
      />
    );
  } else {
    return <ErrorMessage title="Unknown Error" className="basis-1/4" />;
  }
}
