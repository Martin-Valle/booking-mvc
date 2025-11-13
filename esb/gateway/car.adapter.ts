/**
 * ESB - Gateway - Adaptador para Car SOAP Service
 */

import { SoapClient } from './soap-client';
import { getESBConfig } from '../utils/config';
import { createSoapEnvelope, escapeXml, dateToXmlString } from '../utils/soap-utils';
import type { Car, Servicio } from '../models/entities';
import type { FiltrosBusqueda } from '../models/dtos';

export class CarSoapAdapter extends SoapClient {
  constructor() {
    super(getESBConfig().endpoints.car);
  }

  /**
   * Busca autos según filtros
   */
  async buscarAutos(filtros: FiltrosBusqueda): Promise<Servicio[]> {
    const body = `
      <city>${escapeXml(filtros.ciudad || '')}</city>
      <pickupDate>${dateToXmlString(filtros.fechaInicio)}</pickupDate>
      <dropoffDate>${dateToXmlString(filtros.fechaFin)}</dropoffDate>
      <category>economy</category>
      <precioMin>${filtros.precioMin || 0}</precioMin>
      <precioMax>${filtros.precioMax || 999999}</precioMax>
    `;

    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.car.namespace,
      'buscarServicios',
      body
    );

    const response = await this.call(envelope, 'buscarServicios');
    return this.parseAutosResponse(response);
  }

  /**
   * Obtiene detalle de un auto específico
   */
  async obtenerDetalleAuto(carId: string): Promise<Servicio> {
    const body = `<carId>${escapeXml(carId)}</carId>`;
    
    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.car.namespace,
      'obtenerDetalleServicio',
      body
    );

    const response = await this.call(envelope, 'obtenerDetalleServicio');
    return this.parseAutoDetalleResponse(response);
  }

  /**
   * Verifica disponibilidad de autos
   */
  async verificarDisponibilidad(
    carId: string,
    pickupDate: Date,
    dropoffDate: Date
  ): Promise<boolean> {
    const body = `
      <carId>${escapeXml(carId)}</carId>
      <pickupDate>${dateToXmlString(pickupDate)}</pickupDate>
      <dropoffDate>${dateToXmlString(dropoffDate)}</dropoffDate>
    `;

    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.car.namespace,
      'verificarDisponibilidad',
      body
    );

    const response = await this.call(envelope, 'verificarDisponibilidad');
    return this.getNodeBoolean(response, 'disponible', false);
  }

  /**
   * Crea una pre-reserva de auto
   */
  async crearPreReservaAuto(car: Car, holdMinutes: number = 30): Promise<string> {
    const body = `
      <carId>${escapeXml(car.carId || '')}</carId>
      <agencyId>${escapeXml(car.agencyId)}</agencyId>
      <city>${escapeXml(car.city)}</city>
      <pickupOffice>${escapeXml(car.pickupOffice)}</pickupOffice>
      <dropoffOffice>${escapeXml(car.dropoffOffice)}</dropoffOffice>
      <pickupAt>${dateToXmlString(car.pickupAt)}</pickupAt>
      <dropoffAt>${dateToXmlString(car.dropoffAt)}</dropoffAt>
      <driverAge>${car.driverAge}</driverAge>
      <holdMinutes>${holdMinutes}</holdMinutes>
    `;

    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.car.namespace,
      'crearPreReserva',
      body
    );

    const response = await this.call(envelope, 'crearPreReserva');
    return this.getNodeText(response, 'preBookingId');
  }

  /**
   * Confirma una reserva de auto
   */
  async confirmarReservaAuto(preBookingId: string, metodoPago: string): Promise<string> {
    const body = `
      <preBookingId>${escapeXml(preBookingId)}</preBookingId>
      <metodoPago>${escapeXml(metodoPago)}</metodoPago>
    `;

    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.car.namespace,
      'confirmarReserva',
      body
    );

    const response = await this.call(envelope, 'confirmarReserva');
    return this.getNodeText(response, 'bookingId');
  }

  /**
   * Cancela una reserva de auto
   */
  async cancelarReservaAuto(bookingId: string, motivo: string): Promise<boolean> {
    const body = `
      <bookingId>${escapeXml(bookingId)}</bookingId>
      <motivo>${escapeXml(motivo)}</motivo>
    `;

    const envelope = createSoapEnvelope(
      getESBConfig().endpoints.car.namespace,
      'cancelarReservaIntegracion',
      body
    );

    const response = await this.call(envelope, 'cancelarReservaIntegracion');
    return this.getNodeBoolean(response, 'success', false);
  }

  // ==================== Parsers ====================

  private parseAutosResponse(doc: Document): Servicio[] {
    const servicios: Servicio[] = [];
    const carNodes = doc.getElementsByTagName('car');

    for (let i = 0; i < carNodes.length; i++) {
      const carNode = carNodes[i];
      
      const car: Car = {
        carId: this.getNodeValue(carNode, 'carId'),
        agencyId: this.getNodeValue(carNode, 'agencyId'),
        agencyName: this.getNodeValue(carNode, 'agencyName'),
        city: this.getNodeValue(carNode, 'city'),
        marca: this.getNodeValue(carNode, 'marca'),
        modelo: this.getNodeValue(carNode, 'modelo'),
        category: this.getNodeValue(carNode, 'category') as any,
        gearbox: this.getNodeValue(carNode, 'gearbox') as any,
        pickupOffice: this.getNodeValue(carNode, 'pickupOffice'),
        dropoffOffice: this.getNodeValue(carNode, 'dropoffOffice'),
        pickupAt: new Date(this.getNodeValue(carNode, 'pickupAt')),
        dropoffAt: new Date(this.getNodeValue(carNode, 'dropoffAt')),
        driverAge: parseInt(this.getNodeValue(carNode, 'driverAge') || '25'),
        pricePerDay: parseFloat(this.getNodeValue(carNode, 'pricePerDay') || '0'),
        currency: this.getNodeValue(carNode, 'currency') || 'USD',
        photo: this.getNodeValue(carNode, 'photo')
      };

      const servicio: Servicio = {
        idServicio: car.carId,
        serviceType: 'car',
        nombre: `${car.marca} ${car.modelo}`,
        ciudad: car.city,
        precio: car.pricePerDay,
        currency: car.currency,
        disponible: true,
        datosEspecificos: car
      };

      servicios.push(servicio);
    }

    return servicios;
  }

  private parseAutoDetalleResponse(doc: Document): Servicio {
    const car: Car = {
      carId: this.getNodeText(doc, 'carId'),
      agencyId: this.getNodeText(doc, 'agencyId'),
      agencyName: this.getNodeText(doc, 'agencyName'),
      city: this.getNodeText(doc, 'city'),
      hotel: this.getNodeText(doc, 'hotel'),
      marca: this.getNodeText(doc, 'marca'),
      modelo: this.getNodeText(doc, 'modelo'),
      category: this.getNodeText(doc, 'category') as any,
      gearbox: this.getNodeText(doc, 'gearbox') as any,
      pickupOffice: this.getNodeText(doc, 'pickupOffice'),
      dropoffOffice: this.getNodeText(doc, 'dropoffOffice'),
      pickupAt: this.getNodeDate(doc, 'pickupAt') || new Date(),
      dropoffAt: this.getNodeDate(doc, 'dropoffAt') || new Date(),
      driverAge: this.getNodeNumber(doc, 'driverAge', 25),
      pricePerDay: this.getNodeNumber(doc, 'pricePerDay'),
      currency: this.getNodeText(doc, 'currency') || 'USD',
      photo: this.getNodeText(doc, 'photo')
    };

    return {
      idServicio: car.carId,
      serviceType: 'car',
      nombre: `${car.marca} ${car.modelo}`,
      descripcion: this.getNodeText(doc, 'descripcion'),
      ciudad: car.city,
      precio: car.pricePerDay,
      currency: car.currency,
      fotos: [car.photo || ''],
      politicas: this.getNodeText(doc, 'politicas'),
      disponible: true,
      datosEspecificos: car
    };
  }

  private getNodeValue(parentNode: Node, tagName: string): string {
    const nodes = (parentNode as Element).getElementsByTagName(tagName);
    return nodes[0]?.textContent || '';
  }
}

export const carSoapAdapter = new CarSoapAdapter();
