import { User } from "../../mongoDB";
import { IAnimal } from "../../mongoDB/models/Animal";

//! - - - - - - - - -  MONGOOSE STATS  - - - - - - - - - - - - - - -

// GET OBJ FOR STATS BY PROP AND COUNT :
// breed_name  &  device_type  &  location  &  race  &  sex
export async function getObjOfAnimalsByPropAndCount(
  user_id: string,
  userInDBAnimals: IAnimal[] | any,
  prop: string
) {
  try {
    let aggregationAux = [
      {
        $match: {
          _id: {
            $in: [user_id],
          },
        },
      },
      {
        $unwind: "$animals",
      },
      {
        $group: {
          _id: `$animals.${prop}`,
          count: { $sum: 1 },
        },
      },
    ];

    let objForStats: any = {
      //prop1: { count: 4, rows: [{},{},{},{}] },
      //prop2: { count: 2, rows: [{},{}] }
    };
    let aggregationResult = await User.aggregate(aggregationAux);
    aggregationResult.forEach((elem) => {
      objForStats[elem._id || "sin especificar"] = {
        count: elem.count,
        rows: [],
      };
    });
    console.log("OBJ FOR STATS = ", objForStats);

    for (let i = 0; i < userInDBAnimals.length; i++) {
      const key = userInDBAnimals[i][prop];
      console.log(key);

      objForStats[key || "sin especificar"].rows.push(userInDBAnimals[i]);
    }
    return objForStats;
  } catch (error: any) {
    console.log(
      "ERROR EN GET OBJ OF ANIMALS BY PROP AND COUNT con prop = ",
      prop
    );
  }
}

// GET OBJ OF ALL ANIMALS AND COUNT :
function getObjOfAllAnimalsAndCount(userInDBAnimals: IAnimal[]): {
  count: number;
  rows: IAnimal[];
} {
  const allAnimalsAndCount = {
    count: userInDBAnimals.length,
    rows: userInDBAnimals,
  };
  return allAnimalsAndCount;
}

// GET OBJ OF ALL PREGNANT AND NOT PREGNANT :
export function getNotAndPregnantAnimals(userInDBAnimals: IAnimal[]) {
  console.log(`En getPregnantAnimals`);
  try {
    const animalsPregnant: any = {
      count: 0,
      rows: [],
    };
    const animalsNotPregnant: any = {
      count: 0,
      rows: [],
    };

    userInDBAnimals.forEach((animal: IAnimal) => {
      if (animal.is_pregnant === true) {
        animalsPregnant.rows.push(animal);
        animalsPregnant.count++;
      }
      if (animal.is_pregnant === false) {
        animalsNotPregnant.rows.push(animal);
        animalsNotPregnant.count++;
      }
    });
    const pregnantAndNotPregnantObjs = {
      pregnant: animalsPregnant,
      notPregnant: animalsNotPregnant,
    };
    return pregnantAndNotPregnantObjs;
  } catch (error: any) {
    console.log("ERROR EN GET PREGNANT ANIMALS");
  }
}

// HACER LA MISMA FUNCIÓN, pero pasando el usuario encontrado en la db como argumento a cada función, así no tengo que buscar el usuario en cada función y lo busco solamente una vez en la función getStatsObj:

export async function getStatsObjEvo(user_id: string) {
  const userInDB = await User.findById(user_id);

  if (userInDB === null) {
    throw new Error(
      `Usuario con id '${user_id}' no encontrado en la base de datos.`
    );
  }

  const pregnantAndNotPregnantObjs = getNotAndPregnantAnimals(userInDB.animals);

  const statsObjectComplete = {
    allFoundAndCount: getObjOfAllAnimalsAndCount(userInDB.animals),
    deviceType: await getObjOfAnimalsByPropAndCount(
      user_id,
      userInDB.animals,
      "device_type"
    ),
    location: await getObjOfAnimalsByPropAndCount(
      user_id,
      userInDB.animals,
      "location"
    ),
    races: await getObjOfAnimalsByPropAndCount(
      user_id,
      userInDB.animals,
      "breed_name"
    ),
    pregnant: pregnantAndNotPregnantObjs?.pregnant,
    notPregnant: pregnantAndNotPregnantObjs?.notPregnant,
    types: await getObjOfAnimalsByPropAndCount(
      user_id,
      userInDB.animals,
      "type_of_animal"
    ),
    sex: await getObjOfAnimalsByPropAndCount(user_id, userInDB.animals, "sex"),
  };
  return statsObjectComplete;
}

// Ejemplo aproximado del objeto stats que se retorna en la ruta "/stats"
// const stats = {
//   numberOfTotalAnimals: 211,
//   pregnant: { count: 11, rows: [{}, {}] },
//   notPregnant: { count: 76, rows: [{}, {}, {}] },
//   races: {
//     ["Angus"]: { count: 3, rows: [{}, {}, {}, {}] },
//     ["Criolla"]: { count: 2, rows: [{}, {}] },
//     ["Sin especificar"]: { count: 2, rows: [{}, {}] },
//   },
//   types: {
//     ["Vaquillona"]: {
//       count: 53,
//       rows: [{}, {}, {}, {}, {}],
//       pregnants: 11,
//     },
//     ["Toro"]: { count: 8, rows: [{}, {}] },
//     ["Novillo"]: { count: 13, rows: [{}, {}, {}] },
//   },
//   location: {
//     ["Sector 2"]: { count: 7, rows: [{}, {}, {}] },
//     ["Lote-4"]: { count: 2, rows: [{}, {}] },
//     ["Sin especificar"]: { count: 4, rows: [{}, {}] },
//   },
//   deviceType: {
//     ["Ear Tag"]: { count: 34, rows: [{}, {}, {}, {}] },
//     ["Collar"]: { count: 9, rows: [{}, {}] },
//   },
// };
