import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useActionState } from "react";
import { describe, expect, it } from "vitest";

import { usePreserveFormValuesOnError } from "./use-preserve-form-values";

function InvalidForm() {
  const [state, action] = useActionState(
    async (): Promise<{
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }> => ({
      error: "Check the form.",
      fieldErrors: { answer: ["Add a longer answer."] },
    }),
    {}
  );
  const preserveValues = usePreserveFormValuesOnError(state);
  return (
    <form noValidate action={action} onSubmitCapture={preserveValues}>
      <label htmlFor="long-answer">Long answer</label>
      <div>
        <textarea
          id="long-answer"
          name="answer"
          aria-invalid={Boolean(state.fieldErrors?.answer)}
        />
        {state.fieldErrors?.answer ? (
          <p className="text-danger">{state.fieldErrors.answer[0]}</p>
        ) : null}
      </div>
      <button>Submit</button>
      {state.error ? <p role="alert">{state.error}</p> : null}
    </form>
  );
}

describe("usePreserveFormValuesOnError", () => {
  it("restores uncontrolled values after a form action returns an error", async () => {
    render(<InvalidForm />);
    fireEvent.change(screen.getByLabelText("Long answer"), {
      target: { value: "A detailed answer worth keeping" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Check the form.");
      expect(screen.getByLabelText("Long answer")).toHaveValue(
        "A detailed answer worth keeping"
      );
    });

    fireEvent.input(screen.getByLabelText("Long answer"), {
      target: { value: "A corrected detailed answer" },
    });
    expect(screen.getByText("Add a longer answer.")).not.toBeVisible();
    expect(screen.getByLabelText("Long answer")).toHaveAttribute(
      "aria-invalid",
      "false"
    );
  });
});
