package com.connecthub.connecthub.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<String> handleMissingParams(MissingServletRequestParameterException ex) {
        String name = ex.getParameterName();
        System.out.println("❌ Missing Parameter: " + name);
        return ResponseEntity.badRequest().body(name + " parameter is missing");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<String> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String name = ex.getName();
        System.out.println("❌ Type Mismatch: " + name);
        return ResponseEntity.badRequest().body(name + " parameter type mismatch");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGeneral(Exception ex) {
        System.out.println("❌ Generic Error: " + ex.getMessage());
        ex.printStackTrace();
        return ResponseEntity.status(500).body("Internal Server Error: " + ex.getMessage());
    }
}
