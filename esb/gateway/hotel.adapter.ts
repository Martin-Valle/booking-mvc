/**
 * ESB - Gateway - Adaptador para Hotel SOAP Service
 */

import { SoapClient } from './soap-client';
import { getESBConfig } from '../utils/config';
import { createSoapEnvelope, escapeXml, dateToXmlString } from '../utils/soap-utils';
import type { Hotel, Servicio } from '../models/entities';
import type { FiltrosBusqueda } from '../models/dtos';

export class HotelSoapAdapter extends SoapClient {
  constructor() {
    super(getESBConfig().endpoints.hotel);
  }

  /**
   * Busca hoteles según filtros
   */
  async buscarHoteles(filtros: FiltrosBusqueda): Promise<Servicio[]> {
    const body = `
      <ciudad>${escapeXml(filtros.ciudad || '')}</ciudad>
      <checkIn>${dateToXmlString(filtros.fechaInicio)}</checkIn>
      <checkOut>${dateToXmlString(filtros.fechaFin)}</checkOut>
      <adults>${filtros.adults || 1}</adults>
      <children>${filtros.children || 0}</children>
      <precioMin>${filtros.precioMin || 0}</precioMin>
      <precioMax>${filtros.precioMax || 999999}</precioMax>
      <clasificacion>${filtros.clasificacion || 0}</clasificacion>
    `;

    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.hotel.namespace,
      'buscarServicios',
      body
    );

    const response = await this.call(envelope, 'buscarServicios');
    return this.parseHotelesResponse(response);
  }

  /**
   * Obtiene detalle de un hotel específico
   */
  async obtenerDetalleHotel(hotelId: string): Promise<Servicio> {
    const body = `<hotelId>${escapeXml(hotelId)}</hotelId>`;
    
    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.hotel.namespace,
      'obtenerDetalleServicio',
      body
    );

    const response = await this.call(envelope, 'obtenerDetalleServicio');
    return this.parseHotelDetalleResponse(response);
  }

  /**
   * Verifica disponibilidad de habitaciones
   */
  async verificarDisponibilidad(
    hotelId: string,
    roomType: string,
    checkIn: Date,
    checkOut: Date,
    rooms: number
  ): Promise<boolean> {
    const body = `
      <hotelId>${escapeXml(hotelId)}</hotelId>
      <roomType>${escapeXml(roomType)}</roomType>
      <checkIn>${dateToXmlString(checkIn)}</checkIn>
      <checkOut>${dateToXmlString(checkOut)}</checkOut>
      <rooms>${rooms}</rooms>
    `;

    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.hotel.namespace,
      'verificarDisponibilidad',
      body
    );

    const response = await this.call(envelope, 'verificarDisponibilidad');
    return this.getNodeBoolean(response, 'disponible', false);
  }

  /**
   * Crea una pre-reserva de hotel
   */
  async crearPreReservaHotel(hotel: Hotel, holdMinutes: number = 30): Promise<string> {
    const body = `
      <hotelId>${escapeXml(hotel.hotelId || '')}</hotelId>
      <roomType>${escapeXml(hotel.roomType)}</roomType>
      <checkIn>${dateToXmlString(hotel.checkIn)}</checkIn>
      <checkOut>${dateToXmlString(hotel.checkOut)}</checkOut>
      <adults>${hotel.occupancy.adults}</adults>
      <children>${hotel.occupancy.children}</children>
      <board>${escapeXml(hotel.board)}</board>
      <holdMinutes>${holdMinutes}</holdMinutes>
    `;

    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.hotel.namespace,
      'crearPreReserva',
      body
    );

    const response = await this.call(envelope, 'crearPreReserva');
    return this.getNodeText(response, 'preBookingId');
  }

  /**
   * Confirma una reserva de hotel
   */
  async confirmarReservaHotel(preBookingId: string, metodoPago: string): Promise<string> {
    const body = `
      <preBookingId>${escapeXml(preBookingId)}</preBookingId>
      <metodoPago>${escapeXml(metodoPago)}</metodoPago>
    `;

    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.hotel.namespace,
      'confirmarReserva',
      body
    );

    const response = await this.call(envelope, 'confirmarReserva');
    return this.getNodeText(response, 'bookingId');
  }

  /**
   * Cancela una reserva de hotel
   */
  async cancelarReservaHotel(bookingId: string, motivo: string): Promise<boolean> {
    const body = `
      <bookingId>${escapeXml(bookingId)}</bookingId>
      <motivo>${escapeXml(motivo)}</motivo>
    `;

    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.hotel.namespace,
      'cancelarReservaIntegracion',
      body
    );

    const response = await this.call(envelope, 'cancelarReservaIntegracion');
    return this.getNodeBoolean(response, 'success', false);
  }

  // ==================== Parsers ====================

  private parseHotelesResponse(doc: Document): Servicio[] {
    const servicios: Servicio[] = [];
    const hotelNodes = doc.getElementsByTagName('hotel');

    for (let i = 0; i < hotelNodes.length; i++) {
      const hotelNode = hotelNodes[i];
      
      const hotel: Hotel = {
        hotelId: this.getNodeValue(hotelNode, 'hotelId'),
        nombre: this.getNodeValue(hotelNode, 'nombre'),
        ciudad: this.getNodeValue(hotelNode, 'ciudad'),
        roomType: this.getNodeValue(hotelNode, 'roomType') as any,
        numberBeds: parseInt(this.getNodeValue(hotelNode, 'numberBeds') || '1'),
        occupancy: {
          adults: parseInt(this.getNodeValue(hotelNode, 'adults') || '2'),
          children: parseInt(this.getNodeValue(hotelNode, 'children') || '0')
        },
        board: this.getNodeValue(hotelNode, 'board') as any,
        checkIn: new Date(this.getNodeValue(hotelNode, 'checkIn')),
        checkOut: new Date(this.getNodeValue(hotelNode, 'checkOut')),
        amenities: this.getNodeValue(hotelNode, 'amenities').split(',').filter(a => a),
        breakfastIncluded: this.getNodeValue(hotelNode, 'breakfastIncluded') === 'true',
        pricePerNight: parseFloat(this.getNodeValue(hotelNode, 'pricePerNight') || '0'),
        currency: this.getNodeValue(hotelNode, 'currency') || 'USD',
        rating: parseFloat(this.getNodeValue(hotelNode, 'rating') || '0')
      };

      const servicio: Servicio = {
        idServicio: hotel.hotelId,
        serviceType: 'hotel',
        nombre: hotel.nombre,
        ciudad: hotel.ciudad,
        precio: hotel.pricePerNight,
        currency: hotel.currency,
        rating: hotel.rating,
        amenities: hotel.amenities,
        disponible: true,
        datosEspecificos: hotel
      };

      servicios.push(servicio);
    }

    return servicios;
  }

  private parseHotelDetalleResponse(doc: Document): Servicio {
    // Similar al anterior pero con más detalles
    const hotel: Hotel = {
      hotelId: this.getNodeText(doc, 'hotelId'),
      nombre: this.getNodeText(doc, 'nombre'),
      ciudad: this.getNodeText(doc, 'ciudad'),
      direccion: this.getNodeText(doc, 'direccion'),
      roomType: this.getNodeText(doc, 'roomType') as any,
      numberBeds: this.getNodeNumber(doc, 'numberBeds', 1),
      occupancy: {
        adults: this.getNodeNumber(doc, 'adults', 2),
        children: this.getNodeNumber(doc, 'children', 0)
      },
      board: this.getNodeText(doc, 'board') as any,
      checkIn: this.getNodeDate(doc, 'checkIn') || new Date(),
      checkOut: this.getNodeDate(doc, 'checkOut') || new Date(),
      amenities: this.getNodeTexts(doc, 'amenity'),
      breakfastIncluded: this.getNodeBoolean(doc, 'breakfastIncluded'),
      pricePerNight: this.getNodeNumber(doc, 'pricePerNight'),
      currency: this.getNodeText(doc, 'currency') || 'USD',
      rating: this.getNodeNumber(doc, 'rating'),
      photos: this.getNodeTexts(doc, 'photo')
    };

    return {
      idServicio: hotel.hotelId,
      serviceType: 'hotel',
      nombre: hotel.nombre,
      descripcion: this.getNodeText(doc, 'descripcion'),
      ciudad: hotel.ciudad,
      precio: hotel.pricePerNight,
      currency: hotel.currency,
      rating: hotel.rating,
      amenities: hotel.amenities,
      fotos: hotel.photos,
      politicas: this.getNodeText(doc, 'politicas'),
      disponible: true,
      datosEspecificos: hotel
    };
  }

  private getNodeValue(parentNode: Node, tagName: string): string {
    const nodes = (parentNode as Element).getElementsByTagName(tagName);
    return nodes[0]?.textContent || '';
  }
}

export const hotelSoapAdapter = new HotelSoapAdapter();
