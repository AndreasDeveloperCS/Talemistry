import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CityController } from './controllers/cities.controller';
import { CountriesController } from './controllers/countries.controller';
import { CurrenciesController } from './controllers/currencies.controller';
import { City, CitySchema } from './models/city';
import { Country, CountrySchema } from './models/countries';
import { Currency, CurrencySchema } from './models/currency';
import { CityService } from './services/city.service';
import { CountriesService } from './services/countries.service';
import { CurrenciesService } from './services/currencies.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
    }),
    TypeOrmModule.forFeature([
      Currency, City, Country
    ]),
    MongooseModule.forFeature([
      {
        name: Currency.name, schema: CurrencySchema
      },
      {
        name: City.name, schema: CitySchema
      },
      {
        name: Country.name, schema: CountrySchema
      }
    ])
  ],
  controllers: [CurrenciesController, CityController, CountriesController],
  providers: [CurrenciesService, CityService, CountriesService]
})
export class LocationsModule { }
