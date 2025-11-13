/**
 * ESB - Gateway - Adaptador para Flight SOAP Service
 */

import { SoapClient } from './soap-client';
import { getESBConfig } from '../utils/config';
import { createSoapEnvelope, escapeXml, dateToXmlString } from '../utils/soap-utils';
import type { Flight, Servicio } from '../models/entities';
import type { FiltrosBusqueda } from '../models/dtos';

export class FlightSoapAdapter extends SoapClient {
  constructor() {
    super(getESBConfig().endpoints.flight);
  }

  /**
   * Busca vuelos según filtros
   */
  async buscarVuelos(filtros: FiltrosBusqueda): Promise<Servicio[]> {
    const body = `
      <origin>${escapeXml(filtros.ciudad || '')}</origin>
      <destination>${escapeXml('')}</destination>
      <departureDate>${dateToXmlString(filtros.fechaInicio)}</departureDate>
      <adults>${filtros.adults || 1}</adults>
      <children>${filtros.children || 0}</children>
      <cabinClass>Economy</cabinClass>
    `;

    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.flight.namespace,
      'buscarServicios',
      body
    );

    const response = await this.call(envelope, 'buscarServicios');
    return this.parseVuelosResponse(response);
  }

  /**
   * Obtiene detalle de un vuelo específico
   */
  async obtenerDetalleVuelo(flightId: string): Promise<Servicio> {
    const body = `<flightId>${escapeXml(flightId)}</flightId>`;
    
    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.flight.namespace,
      'obtenerDetalleServicio',
      body
    );

    const response = await this.call(envelope, 'obtenerDetalleServicio');
    return this.parseVueloDetalleResponse(response);
  }

  /**
   * Verifica disponibilidad de asientos
   */
  async verificarDisponibilidad(flightId: string, asientos: number): Promise<boolean> {
    const body = `
      <flightId>${escapeXml(flightId)}</flightId>
      <seats>${asientos}</seats>
    `;

    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.flight.namespace,
      'verificarDisponibilidad',
      body
    );

    const response = await this.call(envelope, 'verificarDisponibilidad');
    return this.getNodeBoolean(response, 'disponible', false);
  }

  /**
   * Crea una pre-reserva de vuelo
   */
  async crearPreReservaVuelo(flight: Flight, pasajeros: number, holdMinutes: number = 30): Promise<string> {
    const body = `
      <flightId>${escapeXml(flight.flightId || '')}</flightId>
      <flightNumber>${escapeXml(flight.flightNumber)}</flightNumber>
      <origin>${escapeXml(flight.origin)}</origin>
      <destination>${escapeXml(flight.destination)}</destination>
      <departureTime>${dateToXmlString(flight.departureTime)}</departureTime>
      <pasajeros>${pasajeros}</pasajeros>
      <cabinClass>${escapeXml(flight.cabinClass)}</cabinClass>
      <holdMinutes>${holdMinutes}</holdMinutes>
    `;

    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.flight.namespace,
      'crearPreReserva',
      body
    );

    const response = await this.call(envelope, 'crearPreReserva');
    return this.getNodeText(response, 'preBookingId');
  }

  /**
   * Confirma una reserva de vuelo
   */
  async confirmarReservaVuelo(preBookingId: string, metodoPago: string): Promise<string> {
    const body = `
      <preBookingId>${escapeXml(preBookingId)}</preBookingId>
      <metodoPago>${escapeXml(metodoPago)}</metodoPago>
    `;

    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.flight.namespace,
      'confirmarReserva',
      body
    );

    const response = await this.call(envelope, 'confirmarReserva');
    return this.getNodeText(response, 'bookingId');
  }

  /**
   * Cancela una reserva de vuelo
   */
  async cancelarReservaVuelo(bookingId: string, motivo: string): Promise<boolean> {
    const body = `
      <bookingId>${escapeXml(bookingId)}</bookingId>
      <motivo>${escapeXml(motivo)}</motivo>
    `;

    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.flight.namespace,
      'cancelarReservaIntegracion',
      body
    );

    const response = await this.call(envelope, 'cancelarReservaIntegracion');
    return this.getNodeBoolean(response, 'success', false);
  }

  // ==================== Parsers ====================

  private parseVuelosResponse(doc: Document): Servicio[] {
    const servicios: Servicio[] = [];
    const flightNodes = doc.getElementsByTagName('flight');

    for (let i = 0; i < flightNodes.length; i++) {
      const flightNode = flightNodes[i];
      
      const flight: Flight = {
        flightId: this.getNodeValue(flightNode, 'flightId'),
        origin: this.getNodeValue(flightNode, 'origin'),
        destination: this.getNodeValue(flightNode, 'destination'),
        airline: this.getNodeValue(flightNode, 'airline'),
        flightNumber: this.getNodeValue(flightNode, 'flightNumber'),
        departureTime: new Date(this.getNodeValue(flightNode, 'departureTime')),
        arrivalTime: new Date(this.getNodeValue(flightNode, 'arrivalTime')),
        duration: this.getNodeValue(flightNode, 'duration'),
        cancellationPolicy: this.getNodeValue(flightNode, 'cancellationPolicy'),
        cabinClass: this.getNodeValue(flightNode, 'cabinClass') as any,
        seatType: this.getNodeValue(flightNode, 'seatType') as any,
        price: parseFloat(this.getNodeValue(flightNode, 'price') || '0'),
        currency: this.getNodeValue(flightNode, 'currency') || 'USD',
        availableSeats: parseInt(this.getNodeValue(flightNode, 'availableSeats') || '0')
      };

      const servicio: Servicio = {
        idServicio: flight.flightId,
        serviceType: 'flight',
        nombre: `${flight.airline} ${flight.flightNumber}`,
        descripcion: `${flight.origin} → ${flight.destination}`,
        precio: flight.price,
        currency: flight.currency,
        disponible: (flight.availableSeats || 0) > 0,
        datosEspecificos: flight
      };

      servicios.push(servicio);
    }

    return servicios;
  }

  private parseVueloDetalleResponse(doc: Document): Servicio {
    const flight: Flight = {
      flightId: this.getNodeText(doc, 'flightId'),
      origin: this.getNodeText(doc, 'origin'),
      destination: this.getNodeText(doc, 'destination'),
      airline: this.getNodeText(doc, 'airline'),
      flightNumber: this.getNodeText(doc, 'flightNumber'),
      departureTime: this.getNodeDate(doc, 'departureTime') || new Date(),
      arrivalTime: this.getNodeDate(doc, 'arrivalTime') || new Date(),
      duration: this.getNodeText(doc, 'duration'),
      cancellationPolicy: this.getNodeText(doc, 'cancellationPolicy'),
      cabinClass: this.getNodeText(doc, 'cabinClass') as any,
      seatType: this.getNodeText(doc, 'seatType') as any,
      price: this.getNodeNumber(doc, 'price'),
      currency: this.getNodeText(doc, 'currency') || 'USD',
      availableSeats: this.getNodeNumber(doc, 'availableSeats')
    };

    return {
      idServicio: flight.flightId,
      serviceType: 'flight',
      nombre: `${flight.airline} ${flight.flightNumber}`,
      descripcion: this.getNodeText(doc, 'descripcion'),
      precio: flight.price,
      currency: flight.currency,
      politicas: flight.cancellationPolicy,
      disponible: (flight.availableSeats || 0) > 0,
      datosEspecificos: flight
    };
  }

  private getNodeValue(parentNode: Node, tagName: string): string {
    const nodes = (parentNode as Element).getElementsByTagName(tagName);
    return nodes[0]?.textContent || '';
  }
}

export const flightSoapAdapter = new FlightSoapAdapter();
