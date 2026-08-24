import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomCVService {
    async getBySlug(slug: string) {
        // findOne({ slug, isPublished: true }) …
        return {
            theme: 'public',
            basics: { name: 'Jane Doe', label: 'Full-Stack Engineer' },
            work: [
                { company: 'Acme', position: 'Engineer', startDate: '2021-01', endDate: '2023-06', summary: 'Built things.' }
            ],
            education: [],
            skills: [{ name: 'Angular', level: 'Advanced' }],
            // …rest of your JSON
        };
    }
}