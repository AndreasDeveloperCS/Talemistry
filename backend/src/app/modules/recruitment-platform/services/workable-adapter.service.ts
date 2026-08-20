import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import axios from 'axios';
import { WorkableRequisition } from '../models/requisition';

@Injectable()
export class WorkableAdapterService {
  private readonly WORKABLE_API_TOKEN = process.env.WORKABLE_API_TOKEN;
  private readonly SUBDOMAIN = 'evryka-digital-innovative-solutions';
  private readonly BASE_URL_JOBS = `https://${this.SUBDOMAIN}.workable.com/spi/v3/jobs`;
  private readonly BASE_URL_REQUISITIONS = `https://${this.SUBDOMAIN}.workable.com/spi/v3/requisitions`;


  async createRequisition(requisitionData: WorkableRequisition) {
    // console.log('Workable Adapter, createRequisition:', requisitionData);
    const accountId = await this.getWorkableAccount();
    // console.log('Account id:', accountId);
    //  // console.log('REQUISITIONS:', await this.getRequisitions());
    //  // console.log('All jobs', await this.getJobs());
    const shortcode = '0A200B2DE9'; // shortcode of one of the jobs (got from the this.getJobs() method)
    //  // console.log('Job activities', await this.getJobActivities('0A200B2DE9'));
    // const response = await this.getJobMembers(shortcode);
    const evrykaId = '1adb91'; // id got from the this.getJobMembers(shortcode) method
    // return response;
    //  // console.log(await this.getWorkableMembers(accountId));
    // const member_id = await this.getWorkableMembers(accountId);
    //  // console.log(member_id);
    //  // console.log(await this.getDepartments());
    //  // console.log('RECRUITERS:', await this.getRecruiters());
    //  // console.log('EMPLOYEES:', await this.getEmployees());
    //  // console.log(await this.getWorkableMembers(accountId)); //permission r_members is needed
    //  // console.log('Candidates', await this.getCandidatess());

    // requisitionData = { 
    //   code: {
    //     value: "12/EVR/07"
    //   },
    //   owner_id: evrykaId,
    //   member_id: evrykaId,
    //   hiring_manager_id: evrykaId,
    //   job_title: 'Software Engineer',
    //   plan_date: '2025-04-01'
    // };
    // try {
    //   const response = await axios.post(this.BASE_URL_REQUISITIONS, 
    //     requisitionData, {
    //     headers: {
    //       Authorization: `Bearer ${this.WORKABLE_API_TOKEN}`,
    //       'Accept': 'application/json',
    //       'Content-Type': 'application/json',
    //     },
    //   });
    // return response.data;

    // } catch (error) {
    //   console.error('Error creating requisition:', error.response?.status, JSON.stringify(error.response?.data, null, 2));        
    // }
  }

  async getRequisitions() {
    try {
      const response = await axios.get(this.BASE_URL_REQUISITIONS, {
        headers: {
          Authorization: `Bearer ${this.WORKABLE_API_TOKEN}`
        },
      });
      return response.data;

    } catch (error) {
      console.error('Error getting requisitions:', error.response?.status, JSON.stringify(error.response?.data, null, 2));
    }
  }

  async getDepartments() {
    try {
      const response = await axios.get(`https://${this.SUBDOMAIN}.workable.com/spi/v3/departments`, {
        headers: {
          Authorization: `Bearer ${this.WORKABLE_API_TOKEN}`,
          Accept: 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  async getCandidatess() {
    try {
      const response = await axios.get(`https://${this.SUBDOMAIN}.workable.com/spi/v3/candidates`, {
        headers: {
          Authorization: `Bearer ${this.WORKABLE_API_TOKEN}`,
          Accept: 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching candidates:', error);
      throw error;
    }
  }

  async getRecruiters() {
    try {
      const response = await axios.get(`https://${this.SUBDOMAIN}.workable.com/spi/v3/recruiters`, {
        headers: {
          Authorization: `Bearer ${this.WORKABLE_API_TOKEN}`,
          Accept: 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching recruiters:', error);
      throw error;
    }
  }

  async getEmployees() {
    try {
      const response = await axios.get(`https://${this.SUBDOMAIN}.workable.com/spi/v3/employees`, {
        headers: {
          Authorization: `Bearer ${this.WORKABLE_API_TOKEN}`,
          Accept: 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching recruiters:', error);
      throw error;
    }
  }

  async getWorkableAccount() {
    const url = `https://${this.SUBDOMAIN}.workable.com/spi/v3/accounts`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.WORKABLE_API_TOKEN}`,
          Accept: 'application/json',
        },
      });

      const accountId = response.data?.accounts?.[0]?.id;

      if (!accountId) {
        throw new Error('Account ID not found');
      }

      return accountId;
    } catch (error) {
      console.error('Error fetching Workable account:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data || 'Failed to fetch Workable account',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  //permission r_members is needed
  async getWorkableMembers(accountId: string) {
    const url = `https://${this.SUBDOMAIN}.workable.com/spi/v3/accounts/${accountId}/members`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.WORKABLE_API_TOKEN}`,
          Accept: 'application/json',
        },
      });

      // Check if the response contains members
      if (!response.data || !response.data.members) {
        throw new Error('No members found for this account.');
      }

      return response.data.members;
    } catch (error) {
      console.error('Error fetching Workable members:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data || 'Failed to fetch Workable members',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getJobs() {
    try {
      const response = await axios.get(this.BASE_URL_JOBS, {
        headers: {
          Authorization: `Bearer ${this.WORKABLE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw new Error('Failed to fetch jobs');
    }
  }

  async getJobActivities(shortcode: string) {
    try {
      const response = await axios.get(`https://${this.SUBDOMAIN}.workable.com/spi/v3/jobs/${shortcode}/activities?limit=50`, {
        headers: {
          Authorization: `Bearer ${this.WORKABLE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching job activities:', error);
      throw new Error('Failed to fetch job activities');
    }
  }

  async getJobMembers(shortcode: string) {
    try {
      const response = await axios.get(`https://${this.SUBDOMAIN}.workable.com/spi/v3/jobs/${shortcode}/members?limit=50`, {
        headers: {
          Authorization: `Bearer ${this.WORKABLE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching job members:', error);
      throw new Error('Failed to fetch job members');
    }
  }
}
