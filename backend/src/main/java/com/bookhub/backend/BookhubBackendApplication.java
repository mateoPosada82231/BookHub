package com.bookhub.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BookhubBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BookhubBackendApplication.class, args);
	}

}
