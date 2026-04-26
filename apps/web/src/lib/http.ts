import axios from "axios";

type ApiErrorShape = {
  message?: string;
};

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorShape | string | undefined;

    if (typeof data === "string") {
      return data;
    }

    if (data && typeof data.message === "string") {
      return data.message;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}
