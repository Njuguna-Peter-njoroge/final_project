import { Controller, Get, Param, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('counties')
  async getCounties() {
    return this.locationsService.getCounties();
  }

  @Get('counties/:countyName/zipcodes')
  async getZipCodesByCounty(@Param('countyName') countyName: string) {
    return this.locationsService.getZipCodesByCounty(countyName);
  }

  @Get('search')
  async searchLocations(@Query('q') query: string) {
    return this.locationsService.searchLocations(query);
  }
} 