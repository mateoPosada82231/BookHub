package com.bookhub.backend.api.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.lang.reflect.Field;

/**
 * Validator that checks if at least one field in the object is not null.
 * Uses reflection to inspect all declared fields of the class.
 */
public class AtLeastOneNotNullValidator implements ConstraintValidator<AtLeastOneNotNull, Object> {

    @Override
    public boolean isValid(Object obj, ConstraintValidatorContext context) {
        if (obj == null) {
            return false;
        }

        for (Field field : obj.getClass().getDeclaredFields()) {
            field.setAccessible(true);
            try {
                if (field.get(obj) != null) {
                    return true;
                }
            } catch (IllegalAccessException e) {
                // Skip inaccessible fields
            }
        }

        return false;
    }
}
