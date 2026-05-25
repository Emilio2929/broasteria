package com.broasteria.broasterbackend;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.broasteria.broasterbackend.models.EmpleadoModel;
import com.broasteria.broasterbackend.models.EstadoEmpleado;
import com.broasteria.broasterbackend.repositories.EmpleadoRepository;
import com.broasteria.broasterbackend.repositories.EstadoEmpleadoRepository;

@SpringBootApplication

@EnableAsync
public class BroasterbackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BroasterbackendApplication.class, args);
	}

	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}

	@Bean
	public WebMvcConfigurer webMvcConfigurer() {
		return new WebMvcConfigurer() {
			@Override
			public void addResourceHandlers(ResourceHandlerRegistry registry) {
				registry.addResourceHandler("/pdfs/**")
						.addResourceLocations("file:/C:/pdfs/");
			}
		};
	}

	@Bean
	public CommandLineRunner resetearEstadosAlIniciar(EmpleadoRepository empleadoRepo,
			EstadoEmpleadoRepository estadoRepo) {
		return args -> {
			EstadoEmpleado estadoInactivo = estadoRepo.findById(2).orElse(null);

			// Actualizar todos los empleados a estado "Inactivo"

			if (estadoInactivo != null) {
				List<EmpleadoModel> todos = empleadoRepo.findAll();

				for (EmpleadoModel emp : todos) {
					// Excluir el usuario 'sistema' del reseteo
					if (!emp.getUsuarioLogin().equalsIgnoreCase("sistema")) {
						emp.setEstado(estadoInactivo);
						empleadoRepo.save(emp);
					}

				}
			}
		};
	}
}
