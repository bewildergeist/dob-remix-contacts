import mongoose from "mongoose";
import { json } from "@remix-run/node";
import {
  isRouteErrorResponse,
  useLoaderData,
  useNavigate,
  useRouteError,
} from "@remix-run/react";
import ErrorMessage from "~/components/ErrorMessage";
import invariant from "tiny-invariant";

export async function loader({ params }) {
  invariant(params.contactId, "Missing contactId param");
  invariant(params.noteIndex, "Missing noteIndex param");

  const contact = await mongoose.models.Contact.findById(params.contactId);
  if (!contact) {
    throw new Response("Contact not found", { status: 404 });
  }

  const note = contact.notes[params.noteIndex];
  if (!note) {
    throw new Response("Note not found", { status: 404 });
  }

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
