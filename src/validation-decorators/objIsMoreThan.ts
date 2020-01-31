import {registerDecorator, ValidationOptions, ValidationArguments} from 'class-validator';

export function ObjIsMoreThan(property: string, validationOptions?: ValidationOptions) {
   return (object: object, propertyName: string) => {
        registerDecorator({
            name: 'objIsMoreThan',
            target: object.constructor,
            propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];
                    return  typeof value === 'object' &&
                           typeof relatedValue === 'object' &&
                           value > relatedValue;
                },
            },
        });
   };
}
