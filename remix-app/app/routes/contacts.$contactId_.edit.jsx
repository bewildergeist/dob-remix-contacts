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
        <Input
          name="first"
          ariaLabel="First name"
          defaultValue={actionData?.values?.first ?? contact.first}
          placeholder="First"
          errorMessage={actionData?.errors?.first?.message}
        />
        <Input
          name="last"
          ariaLabel="Last name"
          defaultValue={actionData?.values?.last ?? contact.last}
          placeholder="Last"
          errorMessage={actionData?.errors?.last?.message}
        />
      </p>
      <label htmlFor="twitter">
        <span>Twitter</span>
        <Input
          name="twitter"
          defaultValue={actionData?.values?.twitter ?? contact.twitter}
          placeholder="Twitter"
          errorMessage={actionData?.errors?.twitter?.message}
        />
      </label>
      <label htmlFor="avatar">
        <span>Avatar URL</span>
        <Input
          name="avatar"
          ariaLabel="Avatar URL"
          defaultValue={actionData?.values?.avatar ?? contact.avatar}
          placeholder="https://example.com/avatar.jpg"
          errorMessage={actionData?.errors?.avatar?.message}
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

function Input({ name, defaultValue, ariaLabel, placeholder, errorMessage }) {
  const hasError = errorMessage !== undefined;
  return (
    <div>
      <input
        defaultValue={defaultValue}
        aria-label={ariaLabel}
        name={name}
        type="text"
        placeholder={placeholder}
        aria-describedby={hasError ? `error-${name}` : null}
        className={hasError ? "bg-orange-50" : ""}
      />
      {hasError && (
        <div id={`error-${name}`} className="mt-2 text-sm text-orange-700">
          {errorMessage}
        </div>
      )}
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
