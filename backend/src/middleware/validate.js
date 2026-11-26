function validateSource(schema, source, target) {
  return (request, response, next) => {
    const result = schema.safeParse(request[source]);

    if (!result.success) {
      response.status(400).json({
        message: "Request validation failed.",
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    request[target] = result.data;
    next();
  };
}

export default function validate(schema) {
  return validateSource(schema, "body", "validatedBody");
}

export const validateQuery = (schema) =>
  validateSource(schema, "query", "validatedQuery");

export const validateParams = (schema) =>
  validateSource(schema, "params", "validatedParams");
