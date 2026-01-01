<?php

namespace Espo\Custom\Hooks\CMaterial;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

class LagerplatzCode
{
    private EntityManager $em;

    public function __construct(EntityManager $em)
    {
        $this->em = $em;
    }

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Определяем список полей, которые влияют на lagerplatzCode
        $relatedFields = ['lagerRaum', 'lagerRegal', 'lagerSegment', 'lagerEbene', 'lagerPlatz'];
        
        // Проверяем, изменились ли какие-либо из связанных полей
        $hasChanged = false;
        foreach ($relatedFields as $fieldName) {
            if ($entity->isAttributeChanged($fieldName)) {
                $hasChanged = true;
                break;
            }
        }
        
        // Если не изменилось ни одно из полей и lagerplatzCode уже установлен - ничего не делаем
        if (!$hasChanged && $entity->get('lagerplatzCode')) {
            return;
        }
        
        // Получаем текущие значения полей
        $values = [];
        foreach ($relatedFields as $fieldName) {
            // Получаем текущее значение (то, что пытаются установить)
            $value = $entity->get($fieldName);
            
            // Проверяем, пустое ли значение (null, пустая строка или пробелы)
            if ($value === null || $value === '' || trim($value) === '') {
                // Если поле изменилось на пустое - используем значение по умолчанию '00'
                if ($entity->isAttributeChanged($fieldName)) {
                    $value = '--';
                } else {
                    // Если поле не менялось - проверяем старое значение
                    $oldValue = $entity->getFetched($fieldName);
                    if ($oldValue === null || $oldValue === '' || trim($oldValue) === '') {
                        $value = '--';
                    } else {
                        $value = $oldValue;
                    }
                }
            }
            
            $values[] = (string) $value;
        }
        
        // Формируем код
        $lagerplatzCode = implode('.', $values);
        
        // Устанавливаем значение в поле
        $entity->set('lagerplatzCode', $lagerplatzCode);
    }
}