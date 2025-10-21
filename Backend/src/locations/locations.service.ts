import { Injectable } from '@nestjs/common';

export interface County {
  id: string;
  name: string;
  zipCodes: string[];
}

@Injectable()
export class LocationsService {
  private readonly counties: County[] = [
    {
      id: '1',
      name: 'Nairobi',
      zipCodes: ['00100', '00101', '00102', '00103', '00104', '00105', '00106', '00107', '00108', '00109']
    },
    {
      id: '2',
      name: 'Mombasa',
      zipCodes: ['80100', '80101', '80102', '80103', '80104', '80105', '80106', '80107', '80108', '80109']
    },
    {
      id: '3',
      name: 'Kisumu',
      zipCodes: ['40100', '40101', '40102', '40103', '40104', '40105', '40106', '40107', '40108', '40109']
    },
    {
      id: '4',
      name: 'Nakuru',
      zipCodes: ['20100', '20101', '20102', '20103', '20104', '20105', '20106', '20107', '20108', '20109']
    },
    {
      id: '5',
      name: 'Eldoret',
      zipCodes: ['30100', '30101', '30102', '30103', '30104', '30105', '30106', '30107', '30108', '30109']
    },
    {
      id: '6',
      name: 'Thika',
      zipCodes: ['01000', '01001', '01002', '01003', '01004', '01005', '01006', '01007', '01008', '01009']
    },
    {
      id: '7',
      name: 'Kakamega',
      zipCodes: ['50100', '50101', '50102', '50103', '50104', '50105', '50106', '50107', '50108', '50109']
    },
    {
      id: '8',
      name: 'Kericho',
      zipCodes: ['20200', '20201', '20202', '20203', '20204', '20205', '20206', '20207', '20208', '20209']
    },
    {
      id: '9',
      name: 'Nyeri',
      zipCodes: ['10100', '10101', '10102', '10103', '10104', '10105', '10106', '10107', '10108', '10109']
    },
    {
      id: '10',
      name: 'Machakos',
      zipCodes: ['90100', '90101', '90102', '90103', '90104', '90105', '90106', '90107', '90108', '90109']
    }
  ];

  async getCounties(): Promise<County[]> {
    return this.counties;
  }

  async getZipCodesByCounty(countyName: string): Promise<string[]> {
    const county = this.counties.find(c => 
      c.name.toLowerCase() === countyName.toLowerCase()
    );
    return county ? county.zipCodes : [];
  }

  async searchLocations(query: string): Promise<any[]> {
    const searchTerm = query.toLowerCase();
    const results: any[] = [];

    // Search in counties
    const matchingCounties = this.counties.filter(county =>
      county.name.toLowerCase().includes(searchTerm)
    );

    results.push(...matchingCounties.map(county => ({
      type: 'county',
      name: county.name,
      zipCodes: county.zipCodes
    })));

    // Search in zip codes
    this.counties.forEach(county => {
      const matchingZipCodes = county.zipCodes.filter(zipCode =>
        zipCode.toLowerCase().includes(searchTerm)
      );
      
      if (matchingZipCodes.length > 0) {
        results.push({
          type: 'zipcode',
          county: county.name,
          zipCodes: matchingZipCodes
        });
      }
    });

    return results;
  }
} 