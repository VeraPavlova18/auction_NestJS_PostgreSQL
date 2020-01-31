import {registerDecorator, ValidationOptions, ValidationArguments} from 'class-validator';

export function IsMoreThan(property: string, validationOptions?: ValidationOptions) {
   return (object: object, propertyName: string) => {
        registerDecorator({
            name: 'IsMoreThan',
            target: object.constructor,
            propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];
                    return value > relatedValue;
                },
            },
        });
   };
}
