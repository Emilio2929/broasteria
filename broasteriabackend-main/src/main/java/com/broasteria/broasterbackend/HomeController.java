package com.broasteria.broasterbackend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "Backend BroasteriaFastFood está funcionando correctamente.";
    }
}
