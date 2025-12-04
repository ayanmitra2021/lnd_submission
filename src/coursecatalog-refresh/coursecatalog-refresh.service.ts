
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseCatalog } from '../submission/entities/coursecatalog.entity';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import { MarketofferingService } from '../marketoffering/marketoffering.service'; // Import the service

export interface CsvRow {
  'Course ID (DO NOT CHANGE)': string;
  'Edit Flag': 'Delete Row' | 'No Change' | 'Edited Row' | 'New Row';
  'Market Offering / Specialty': string;
  'Learning Pillar / L5': string;
  courseName: string;
  courseLink: string;
  description: string;
  'duration (Hr)': string;
  vendorPlatform: string;
  enrollmentGuidance: string;
  level: string;
  courseORcertification: string;
  paidORFree: string;
  keyword?: string;
  Mapping?: string;
  'Validation Status'?: string;
}

export interface ErrorRecord {
  courseId: string;
  errors: string[];
}

export interface RefreshResult {
  inserted: number;
  updated: number;
  inactivated: number;
  unchanged: number;
  errors: ErrorRecord[];
}

@Injectable()
export class CourseCatalogRefreshService {
  private readonly logger = new Logger(CourseCatalogRefreshService.name);

  constructor(
    @InjectRepository(CourseCatalog)
    private readonly courseCatalogRepository: Repository<CourseCatalog>,
    private readonly marketofferingService: MarketofferingService, // Inject MarketofferingService
  ) {}

  async processCsv(file: Express.Multer.File): Promise<RefreshResult> {
    const result: RefreshResult = {
      inserted: 0,
      updated: 0,
      inactivated: 0,
      unchanged: 0,
      errors: [],
    };

    const records: CsvRow[] = [];
    const stream = Readable.from(file.buffer);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv({
            headers: [
                'Course ID (DO NOT CHANGE)', 'Edit Flag', 'Market Offering / Specialty',
                'Learning Pillar / L5', 'courseName', 'courseLink', 'description',
                'duration (Hr)', 'vendorPlatform', 'enrollmentGuidance', 'level',
                'courseORcertification', 'paidORFree', 'keyword', 'Mapping', 'Validation Status'
            ],
            skipLines: 1
        }))
        .on('data', (row: CsvRow) => {
          records.push(row);
        })
        .on('end', async () => {
          this.logger.log('CSV file successfully read. Starting processing...');
          for (const record of records) {
            try {
              await this.processRow(record, result);
            } catch (error) {
              this.logger.error(`Error processing row: ${JSON.stringify(record)}`, error.stack);
              result.errors.push({ courseId: record['Course ID (DO NOT CHANGE)'], errors: [error.message] });
            }
          }
          this.logger.log('CSV file successfully processed.');
          resolve(result);
        })
        .on('error', (error) => {
          this.logger.error('Error processing CSV file', error.stack);
          reject(error);
        });
    });
  }



    private async processRow(row: CsvRow, result: RefreshResult): Promise<void> {
      const courseId = row['Course ID (DO NOT CHANGE)'];
      if (!courseId) {
        return;
      }
      const editFlag = row['Edit Flag'];
  
      if (editFlag === 'Edited Row' || editFlag === 'New Row') {
        // Basic validation for mandatory fields
        const mandatoryFields = [
          'Course ID (DO NOT CHANGE)', 'Edit Flag', 'Market Offering / Specialty',
          'Learning Pillar / L5', 'courseName', 'courseLink', 'description',
          'duration (Hr)', 'vendorPlatform', 'enrollmentGuidance', 'level',
          'courseORcertification', 'paidORFree'
        ];
        const missingFields = mandatoryFields.filter(field => !row[field]);
        if (missingFields.length > 0) {
          result.errors.push({ courseId, errors: [`Missing mandatory fields: ${missingFields.join(', ')}`] });
          return;
        }
  
        // Market Offering validation
        const marketOfferingName = row['Market Offering / Specialty'];
        const isMarketOfferingValid = await this.marketofferingService.validateMarketOffering(marketOfferingName);
        if (!isMarketOfferingValid) {
            result.errors.push({ courseId, errors: [`Market Offering / Specialty "${marketOfferingName}" is not valid.`] });
            return;
        }

        // Duration validation
        const duration = parseFloat(row['duration (Hr)']);
        if (isNaN(duration) || duration < 0 || duration > 30000) {
            result.errors.push({ courseId, errors: ['Invalid duration. Must be a number between 0 and 30000.'] });
            return;
        }
      }
      
      const duration = parseFloat(row['duration (Hr)']);
  
  
      switch (editFlag) {
        case 'Delete Row':
          const courseToInactivate = await this.courseCatalogRepository.findOne({ where: { coursecode: courseId } });
          if (courseToInactivate) {
            courseToInactivate.isactive = false;
            await this.courseCatalogRepository.save(courseToInactivate);
            result.inactivated++;
          } else {
              result.errors.push({ courseId, errors: [`Course with code "${courseId}" not found for inactivation.`] });
          }
          break;
        case 'No Change':
          result.unchanged++;
          break;
        case 'Edited Row':
          const courseToUpdate = await this.courseCatalogRepository.findOne({ where: { coursecode: courseId } });
          if (courseToUpdate) {
              courseToUpdate.marketoffering = row['Market Offering / Specialty'];
              courseToUpdate.learningpillar = row['Learning Pillar / L5'];
              courseToUpdate.coursename = row.courseName;
              courseToUpdate.courselink = row.courseLink;
              courseToUpdate.coursedescription = row.description;
              courseToUpdate.duration = duration;
              courseToUpdate.vendorplatform = row.vendorPlatform;
              courseToUpdate.courselevel = row.level;
              courseToUpdate.courseorcertification = row.courseORcertification;
              courseToUpdate.paidorfree = row.paidORFree;
              courseToUpdate.keywords = row.keyword;
              await this.courseCatalogRepository.save(courseToUpdate);
              result.updated++;
          } else {
              result.errors.push({ courseId, errors: [`Course with code "${courseId}" not found for update.`] });
          }
          break;
        case 'New Row':
          let course = await this.courseCatalogRepository.findOne({ where: { coursecode: courseId } });
          if (course) {
              // Update existing course
              course.marketoffering = row['Market Offering / Specialty'];
              course.learningpillar = row['Learning Pillar / L5'];
              course.coursename = row.courseName;
              course.courselink = row.courseLink;
              course.coursedescription = row.description;
              course.duration = duration;
              course.vendorplatform = row.vendorPlatform;
              course.courselevel = row.level;
              course.courseorcertification = row.courseORcertification;
              course.paidorfree = row.paidORFree;
              course.keywords = row.keyword;
              await this.courseCatalogRepository.save(course);
              result.updated++;
          } else {
              // Create new course
              const newCourse = this.courseCatalogRepository.create({
                  coursecode: courseId,
                  marketoffering: row['Market Offering / Specialty'],
                  learningpillar: row['Learning Pillar / L5'],
                  coursename: row.courseName,
                  courselink: row.courseLink,
                  coursedescription: row.description,
                  duration: duration,
                  vendorplatform: row.vendorPlatform,
                  courselevel: row.level,
                  courseorcertification: row.courseORcertification,
                  paidorfree: row.paidORFree,
                  keywords: row.keyword,
                  isactive: true,
              });
              await this.courseCatalogRepository.save(newCourse);
              result.inserted++;
          }
          break;
        default:
          result.errors.push({ courseId, errors: [`Invalid Edit Flag: "${editFlag}"`] });
          break;
      }
    }}
