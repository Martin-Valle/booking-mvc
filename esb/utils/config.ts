/**
 * ESB - Configuración de Endpoints y Namespaces
 */

export interface EndpointConfig {
  url: string;
  namespace: string;
  timeout?: number;
  enabled: boolean;
}

export interface ESBConfig {
  endpoints: {
    hotel: EndpointConfig;
    hotelBoutique: EndpointConfig;
    hotelCampestre: EndpointConfig;
    hotelUIO: EndpointConfig;
    km25Madrid: EndpointConfig;
    realCuenca: EndpointConfig;
    wsIntegracion: EndpointConfig;
    weWorkHubIntegracion: EndpointConfig;
    car: EndpointConfig;
    cuencaCar: EndpointConfig;
    autosRentCar: EndpointConfig;
    alquilerAugye: EndpointConfig;
    flight: EndpointConfig;
    skyandes: EndpointConfig;
    restaurant: EndpointConfig;
    cafeteria: EndpointConfig;
    cangrejoFeliz: EndpointConfig;
    saborAndino: EndpointConfig;
    sushiBar: EndpointConfig;
    dragonRojo: EndpointConfig;
    sieteMares: EndpointConfig;
    easyCar: EndpointConfig;
    rentaAutosMadrid: EndpointConfig;
    hotelPerros: EndpointConfig;
    backendCuenca: EndpointConfig;
    package: EndpointConfig;
  };
  database: {
    enabled: boolean;
    cacheTimeout: number; // ms
  };
  retry: {
    maxRetries: number;
    delayMs: number;
  };
  logging: {
    enabled: boolean;
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  };
}

/**
 * Configuración por defecto del ESB
 * NOTA: Ajusta estas URLs cuando tengas los endpoints reales de tus amigos
 */
export const defaultConfig: ESBConfig = {
  endpoints: {
    hotel: {
      url: 'http://localhost:8081/hotel-service',
      namespace: 'http://booking.esb/hotel',
      timeout: 30000,
      enabled: true
    },
    hotelBoutique: {
      url: 'http://hotelboutique.runasp.net/WS_Integracion.asmx',
      namespace: 'http://hotelparis.com/integracion',
      timeout: 30000,
      enabled: true
    },
    hotelCampestre: {
      url: 'https://hotelcampestre-erdgb0cvedd7asb9.canadacentral-01.azurewebsites.net/WS_Integracion.asmx',
      namespace: 'http://hotelcampestre.com/integracion',
      timeout: 30000,
      enabled: true
    },
    hotelUIO: {
      url: 'http://hoteluio.runasp.net/Services/HotelService.asmx',
      namespace: 'http://mio.hotel/booking',
      timeout: 30000,
      enabled: true
    },
    km25Madrid: {
      url: 'http://km25madrid.runasp.net/Services/HotelService.asmx',
      namespace: 'http://mio.hotel/booking',
      timeout: 30000,
      enabled: true
    },
    realCuenca: {
      url: 'https://realdecuencaintegracion-abachrhfgzcrb0af.canadacentral-01.azurewebsites.net/WS_GestionIntegracionDetalleEspacio.asmx',
      namespace: 'http://tempuri.org/',
      timeout: 30000,
      enabled: true
    },
    wsIntegracion: {
      url: 'https://wsintegracion20251023235213-g9h0b9a7cdanbhac.canadacentral-01.azurewebsites.net/IntegracionService.svc/basic',
      namespace: 'http://tempuri.org/',
      timeout: 30000,
      enabled: true
    },
    weWorkHubIntegracion: {
      url: 'http://inegracion.runasp.net/WS_Integracion.asmx',
      namespace: 'http://weworkhub/integracion',
      timeout: 30000,
      enabled: true
    },
    car: {
      url: 'http://localhost:8082/car-service',
      namespace: 'http://booking.esb/car',
      timeout: 30000,
      enabled: true
    },
    cuencaCar: {
      url: 'http://wscuencaarriendoautos.runasp.net/WS_IntegracionServicioAUTOS.asmx',
      namespace: 'http://arriendoautos.com/integracion',
      timeout: 30000,
      enabled: true
    },
    autosRentCar: {
      url: 'http://autos.runasp.net/WS_IntegracionAutos.asmx',
      namespace: 'http://tuservidor.com/booking/autos',
      timeout: 30000,
      enabled: true
    },
    flight: {
      url: 'http://localhost:8083/flight-service',
      namespace: 'http://booking.esb/flight',
      timeout: 30000,
      enabled: true
    },
    skyandes: {
      url: 'http://skyandesintegracion.runasp.net/WS_Integracion.asmx',
      namespace: 'http://skyandes.com/integracion/',
      timeout: 30000,
      enabled: true
    },
    restaurant: {
      url: 'https://sanctumcortejo.runasp.net/Ws_IntegracionRestaurante.asmx',
      namespace: 'http://sanctumcortejo.ec/Integracion',
      timeout: 30000,
      enabled: true
    },
    cafeteria: {
      url: 'https://cafeteriaparis-c4d5ghhbfqe2fkfs.canadacentral-01.azurewebsites.net/integracion.asmx',
      namespace: 'http://cafeteria.com/integracion',
      timeout: 30000,
      enabled: true
    },
    cangrejoFeliz: {
      url: 'https://elcangrejofeliz.runasp.net/WS_IntegracionRestaurante.asmx',
      namespace: 'http://elcangrejofeliz.ec/Integracion',
      timeout: 30000,
      enabled: true
    },
    saborAndino: {
      url: 'https://saborandino.runasp.net/Ws_IntegracionRestaurante.asmx',
      namespace: 'http://SaborAndino.ec/Integracion',
      timeout: 30000,
      enabled: true
    },
    sushiBar: {
      url: 'http://wsintegracion.runasp.net/IntegracionSoapService.asmx',
      namespace: 'http://sushibar1.com/',
      timeout: 30000,
      enabled: true
    },
    alquilerAugye: {
      url: 'http://alquileraugye.runasp.net/AutosIntegracion.asmx',
      namespace: 'http://tuservidor.com/booking/autos',
      timeout: 30000,
      enabled: true
    },
    dragonRojo: {
      url: 'http://dragonrojo.runasp.net/WS_IntegracionRestaurante.asmx',
      namespace: 'http://dragonrojo.ec/Integracion',
      timeout: 30000,
      enabled: true
    },
    sieteMares: {
      url: 'http://7maresrestaurant.runasp.net/Services/IntegracionSoapService.asmx',
      namespace: 'http://sushibar1.com/',
      timeout: 30000,
      enabled: true
    },
    easyCar: {
      url: 'http://easycar.runasp.net/IntegracionService.asmx',
      namespace: 'http://tuservidor.com/booking/autos',
      timeout: 30000,
      enabled: true
    },
    rentaAutosMadrid: {
      url: 'http://rentaautosmadrid.runasp.net/IntegracionService.asmx',
      namespace: 'http://rentaautos.es/integracion',
      timeout: 30000,
      enabled: true
    },
    hotelPerros: {
      url: 'https://wsintegracionhotel20251024134454-gxaqacbthwcdgzer.canadacentral-01.azurewebsites.net/WS_Integracion_Hotel.asmx',
      namespace: 'http://hotelperros.com/integracion',
      timeout: 30000,
      enabled: true
    },
    backendCuenca: {
      url: 'http://backend-cuenca.onrender.com/WS_Integracion.asmx',
      namespace: 'urn:cuenca.integracion',
      timeout: 30000,
      enabled: true
    },
    package: {
      url: 'http://localhost:8085/package-service',
      namespace: 'http://booking.esb/package',
      timeout: 30000,
      enabled: true
    }
  },
  database: {
    enabled: true,
    cacheTimeout: 300000 // 5 minutos
  },
  retry: {
    maxRetries: 3,
    delayMs: 1000
  },
  logging: {
    enabled: true,
    level: 'INFO'
  }
};

let currentConfig: ESBConfig = { ...defaultConfig };

export function getESBConfig(): ESBConfig {
  return currentConfig;
}

export function updateESBConfig(config: Partial<ESBConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...config
  };
}

export function resetESBConfig(): void {
  currentConfig = { ...defaultConfig };
}
