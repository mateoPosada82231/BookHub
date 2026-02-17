package com.bookhub.backend.api.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Validation annotation that ensures at least one field in the annotated class is not null.
 * Used for partial update requests where sending an empty body should be rejected.
 */
@Documented
@Constraint(validatedBy = AtLeastOneNotNullValidator.class)
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface AtLeastOneNotNull {
    String message() default "Al menos un campo debe ser proporcionado para la actualización";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
