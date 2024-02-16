import mongoose from "mongoose";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  isRouteErrorResponse,
  useActionData,
  useLoaderData,
  useNavigate,
  useRouteError,
} from "@remix-run/react";
import invariant from "tiny-invariant";
import ErrorMessage from "~/components/ErrorMessage";

export async function loader({ params }) {
  invariant(params.contactId, "Missing contactId param");
  const contact = await mongoose.models.Contact.findById(params.contactId);
  if (!contact) {
    throw new Response("Contact not found", { status: 404 });
  }
  return json({ contact });
}

export default function EditContact() {
  const { contact } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();

  return (
    <Form id="contact-form" method="post">
      <p>
        <span>Name</span>
        <div>
          <input
            defaultValue={actionData?.values?.first ?? contact.first}
            aria-label="First name"
            name="first"
            type="text"
            placeholder="First"
            aria-describedby={actionData?.errors?.first ? "error-first" : null}
            className={actionData?.errors?.first ? "bg-orange-50" : ""}
          />
          {actionData?.errors?.first && (
            <div id="error-first" className="mt-2 text-sm text-orange-700">
              {actionData.errors.first.message}
            </div>
          )}
        </div>
        <input
          aria-label="Last name"
          defaultValue={contact.last}
          name="last"
          placeholder="Last"
          type="text"
        />
      </p>
      <label>
        <span>Twitter</span>
        <input
          defaultValue={contact.twitter}
          name="twitter"
          placeholder="@jack"
          type="text"
        />
      </label>
      <label>
        <span>Avatar URL</span>
        <input
          aria-label="Avatar URL"
          defaultValue={contact.avatar}
          name="avatar"
          placeholder="https://example.com/avatar.jpg"
          type="text"
        />
      </label>
      <p>
        <button type="submit">Save</button>
        <button type="button" onClick={() => navigate(-1)}>
          Cancel
        </button>
      </p>
    </Form>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <ErrorMessage
        title={error.status + " " + error.statusText}
        message={error.data}
      />
    );
  } else if (error instanceof Error) {
    return <ErrorMessage title={error.message} message={error.stack} />;
  } else {
    return <ErrorMessage title="Unknown Error" />;
  }
}

export async function action({ params, request }) {
  invariant(params.contactId, "Missing contactId param");
  const formData = await request.formData();
  const contact = await mongoose.models.Contact.findById(params.contactId);
  if (!contact) {
    throw new Response("Contact not found", { status: 404 });
  }
  contact.first = formData.get("first");
  contact.last = formData.get("last");
  contact.twitter = formData.get("twitter");
  contact.avatar = formData.get("avatar");
  try {
    await contact.save();
  } catch (error) {
    return json(
      {
        // Pass the validation errors back to the client to be displayed
        // alongside the relevant form fields. We get these errrors from the
        // Mongoose model's validation:
        // https://mongoosejs.com/docs/validation.html#validation-errors
        errors: error.errors,
        // Pass the form data back to the client as "values" so the user doesn't
        // lose their changes in case JavaScript is disabled and the page reloads
        // on submit.
        values: Object.fromEntries(formData),
      },
      { status: 400 },
    );
  }
  return redirect(`/contacts/${params.contactId}`);
}
