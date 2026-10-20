import mongoose, {



  Types,



} from "mongoose";



import Cart, {



  ICart,



  ICartItem,



} from "../models/Cart.model";



import Product from "../models/Product.model";



import DiscountCode from "../models/DiscountCode.model";



import { calculateDiscounts } from "./discount.service";



import {

  calculateContextOffers,

} from "./offer-pricing.service";



import { markActivityEmailSent, trackUserActivity } from "./activity.service";



import { sendCartAddedEmail } from "./commerce-email.service";



import { calculateTax } from "./tax.service";



/* =========================================================



   TYPES



========================================================= */



export type CartOfferType =



  | "buy_get"



  | "fixed_price_bundle";



export type CartOfferSource =



  | "buy_get_page"



  | "fixed_price_bundle";



export interface CartOfferContextInput {



  offerId: string;



  offerType: CartOfferType;



  source: CartOfferSource;



}



export interface AddCartItemData {



  productId: string;



  colorId: string;



  sizeId: string;



  quantity?: number;



  offerContext?:



    | CartOfferContextInput



    | null;



}



export interface UpdateCartItemData {



  quantity: number;



}



/* =========================================================



   HELPERS



========================================================= */



const validateObjectId = (



  value: string,



  fieldName: string



) => {



  if (



    !value ||



    !mongoose.Types.ObjectId.isValid(



      value



    )



  ) {



    throw new Error(



      `Invalid ${fieldName}.`



    );



  }



};



const normalizeQuantity = (



  value: unknown,



  defaultValue = 1



): number => {



  if (



    value === undefined ||



    value === null ||



    value === ""



  ) {



    return defaultValue;



  }



  const quantity =



    Number(value);



  if (



    !Number.isInteger(



      quantity



    ) ||



    quantity < 1 ||



    quantity > 99



  ) {



    throw new Error(



      "Quantity must be a whole number between 1 and 99."



    );



  }



  return quantity;



};



const normalizeOfferContext = (



  value:



    | CartOfferContextInput



    | null



    | undefined



) => {



  if (!value) {



    return {



      offerId: null as Types.ObjectId | null,



      offerType: "" as CartOfferType | "",



      offerSource: "" as CartOfferSource | "",



    };



  }



  const offerId =



    String(



      value.offerId ||



        ""



    ).trim();



  const offerType =



    String(



      value.offerType ||



        ""



    ).trim() as CartOfferType;



  const offerSource =



    String(



      value.source ||



        ""



    ).trim() as CartOfferSource;



  validateObjectId(



    offerId,



    "offer ID"



  );



  if (



    offerType === "buy_get" &&



    offerSource !== "buy_get_page"



  ) {



    throw new Error(



      "Buy/Get offer can only be added from the Buy/Get offer page."



    );



  }



  if (



    offerType === "fixed_price_bundle" &&



    offerSource !== "fixed_price_bundle"



  ) {



    throw new Error(



      "Invalid fixed-price bundle source."



    );



  }



  if (



    offerType !== "buy_get" &&



    offerType !== "fixed_price_bundle"



  ) {



    throw new Error(



      "Invalid cart offer type."



    );



  }



  return {



    offerId:



      new Types.ObjectId(



        offerId



      ),



    offerType,



    offerSource,



  };



};



const getVariant = (



  product: any,



  colorId: string,



  sizeId: string



) => {



  const color =



    product.colors?.find(



      (item: any) =>



        String(



          item._id



        ) === colorId



    );



  if (!color) {



    throw new Error(



      "Selected product color was not found."



    );



  }



  const size =



    color.sizes?.find(



      (item: any) =>



        String(



          item._id



        ) === sizeId



    );



  if (!size) {



    throw new Error(



      "Selected product size was not found."



    );



  }



  if (!size.isActive) {



    throw new Error(



      "Selected product size is inactive."



    );



  }



  return {



    color,



    size,



  };



};



const getAvailableStock = (



  _product: any,



  size: any



) => {



  return Math.max(0, Number(size?.stock ?? 0));



};



const getOrCreateCart =



  async (



    userId: string



  ): Promise<ICart> => {



    let cart =



      await Cart.findOne({



        user: userId,



      });



    if (!cart) {



      cart =



        await Cart.create({



          user:



            new Types.ObjectId(



              userId



            ),



          items: [],



        });



    }



    return cart;



  };



const buildCartResponse =



  async (



    cart: ICart



  ) => {



    const productIds =



      Array.from(



        new Set(



          cart.items.map(



            item =>



              String(



                item.product



              )



          )



        )



      );



    const products =



      productIds.length > 0



        ? await Product.find({



            _id: {



              $in:



                productIds,



            },



          }).lean()



        : [];



    const productMap =



      new Map(



        products.map(



          product => [



            String(



              product._id



            ),



            product,



          ]



        )



      );



    let subtotal = 0;



    let totalItems = 0;



    const items =



      cart.items.map(



        item => {



          const product =



            productMap.get(



              String(



                item.product



              )



            ) as any;



          const quantity =



            Number(



              item.quantity



            );



          totalItems +=



            quantity;



          if (!product) {



            return {



              _id:



                item._id,



              product: null,



              colorId:



                item.colorId,



              sizeId:



                item.sizeId,



              quantity,



              unitPrice: 0,



              subtotal: 0,



              available:



                false,



              unavailableReason:



                "Product no longer exists.",



              offerContext:



                item.offerId



                  ? {



                      offerId:



                        String(



                          item.offerId



                        ),



                      offerType:



                        item.offerType ||



                        "",



                      source:



                        item.offerSource ||



                        "",



                    }



                  : null,



              addedAt:



                item.addedAt,



              updatedAt:



                item.updatedAt || item.addedAt,



              ageMs:



                item.addedAt ? Math.max(0, Date.now() - new Date(item.addedAt).getTime()) : 0,



            };



          }



          const color =



            product.colors?.find(



              (value: any) =>



                String(



                  value._id



                ) ===



                String(



                  item.colorId



                )



            );



          const size =



            color?.sizes?.find(



              (value: any) =>



                String(



                  value._id



                ) ===



                String(



                  item.sizeId



                )



            );



          const availableStock =



            color && size



              ? getAvailableStock(



                  product,



                  size



                )



              : 0;



          const available =



            product.isActive !== false &&



            Boolean(size?.isActive) &&



            availableStock >= quantity;



          const unitPrice =



            Number(



              size?.showPrice ??



              color?.showPrice ??



              0



            );



          const itemSubtotal =



            unitPrice *



            quantity;



          if (available) {



            subtotal +=



              itemSubtotal;



          }



          return {



            _id:



              item._id,



            product: {



              _id:



                product._id,



              name:



                color?.nameProduct || "Product",



              slug:



                color?.slugProduct || "",



              price:



                unitPrice,



              compareAtPrice:



                Number(size?.originalPrice ?? color?.originalPrice ?? unitPrice),



              stock:



                availableStock,



              mainImages:



                color?.images ||



                [],



              status:



                product.isActive !== false ? "active" : "inactive",



            },



            selectedColor:



              color



                ? {



                    _id:



                      color._id,



                    name:



                      color.nameColor,



                    slug:



                      color.slugColor,



                    hex:



                      color.hex,



                    images:



                      color.images ||



                      [],



                    isActive:



                      true,



                  }



                : null,



            selectedSize:



              size



                ? {



                    _id:



                      size._id,



                    size:



                      size.size,



                    sku:



                      size.sku,



                    stock:



                      size.stock,



                    isActive:



                      size.isActive,



                  }



                : null,



            colorId:



              item.colorId,



            sizeId:



              item.sizeId,



            quantity,



            offerContext:



              item.offerId



                ? {



                    offerId:



                      String(



                        item.offerId



                      ),



                    offerType:



                      item.offerType ||



                      "",



                    source:



                      item.offerSource ||



                      "",



                  }



                : null,



            unitPrice,



            subtotal:



              itemSubtotal,



            availableStock,



            available,



            addedAt:



              item.addedAt,



            updatedAt:



              item.updatedAt || item.addedAt,



            ageMs:



              item.addedAt ? Math.max(0, Date.now() - new Date(item.addedAt).getTime()) : 0,



          };



        }



      );



    /* =======================================================

       DISCOUNT INPUT



       This is the IMPORTANT bridge between cart context and

       backend pricing.



       Normal item:

         offerId = null



       Buy/Get page item:

         offerType = buy_get

         offerSource = buy_get_page



       Fixed bundle item:

         offerType = fixed_price_bundle

         offerSource = fixed_price_bundle

    ======================================================= */



    const discountInput =

      items

        .filter(

          (item: any) =>

            item.available &&

            item.product?._id

        )

        .map(

          (item: any) => ({

            lineId:

              String(

                item._id ||

                  ""

              ),



            productId:

              String(

                item.product._id

              ),



            unitPrice:

              Number(

                item.unitPrice ||

                  0

              ),



            quantity:

              Number(

                item.quantity ||

                  0

              ),



            offerId:

              item.offerContext

                ?.offerId

                ? String(

                    item.offerContext.offerId

                  )

                : null,



            offerType:

              String(

                item.offerContext

                  ?.offerType ||

                  ""

              ),



            offerSource:

              String(

                item.offerContext

                  ?.source ||

                  ""

              ),

          })

        );



    /* =======================================================

       EXISTING DISCOUNT ENGINE



       Existing discount.service.ts stays untouched.



       We keep it for:

       - automatic discount

       - discount code / coupon



       IMPORTANT:

       Its old/global offer result is NOT used for final offer

       pricing anymore. That is exactly what was causing

       Buy 3 Get 1 Free to appear on bundle items.

    ======================================================= */



    const legacyDiscountResult: any =

      await calculateDiscounts(

        discountInput as any,

        cart.discountCode ||

          null

      );



    /* =======================================================

       CORRECT CONTEXT-BOUND OFFER ENGINE



       Buy/Get:

       ONLY source = buy_get_page



       Fixed price bundle:

       ONLY source = fixed_price_bundle

    ======================================================= */



    const offerPricing =

      await calculateContextOffers(

        discountInput as any

      );



    const legacyDiscountByLine =

      new Map<

        string,

        any

      >(

        Array.isArray(

          legacyDiscountResult

            ?.itemDiscounts

        )

          ? legacyDiscountResult.itemDiscounts.map(

              (

                item:

                  any

              ) => [

                String(

                  item.lineId ||

                    item.productId ||

                    ""

                ),

                item,

              ]

            )

          : []

      );



    const roundMoney = (

      value:

        unknown

    ) => {

      const numericValue =

        Number(

          value ||

            0

        );



      if (

        !Number.isFinite(

          numericValue

        )

      ) {

        return 0;

      }



      return Number(

        Math.max(

          0,

          numericValue

        ).toFixed(

          2

        )

      );

    };



    /* =======================================================

       FINAL LINE DISCOUNTS



       Order:

       1. Correct Buy/Get OR Bundle offer

       2. Existing automatic discount

       3. Existing coupon discount



       The legacy offer amount is ignored completely.

    ======================================================= */



    const discountedItems =

      items.map(

        (

          item:

            any

        ) => {

          if (

            !item.product?._id

          ) {

            return item;

          }



          const lineId =

            String(

              item._id ||

                ""

            );



          const productId =

            String(

              item.product._id

            );



          const legacyLine =

            legacyDiscountByLine.get(

              lineId

            ) ||

            legacyDiscountByLine.get(

              productId

            ) ||

            {};



          const lineSubtotal =

            roundMoney(

              item.subtotal

            );



          /* -----------------------------------------------

             CORRECT OFFER DISCOUNT

          ----------------------------------------------- */



          const offerDiscount =

            Math.min(

              lineSubtotal,

              roundMoney(

                offerPricing

                  .offerDiscountByLine

                  .get(

                    lineId

                  ) ||

                  0

              )

            );



          const afterOffer =

            roundMoney(

              lineSubtotal -

                offerDiscount

            );



          /* -----------------------------------------------

             AUTOMATIC DISCOUNT



             Existing engine may have calculated automatic

             discount after its own old offer.



             We scale the existing line discount onto the new

             correct post-offer base. This keeps the existing

             rule eligibility while preventing old Buy/Get

             pricing from leaking into the final cart.

          ----------------------------------------------- */



          const oldOfferDiscount =

            Math.min(

              lineSubtotal,

              roundMoney(

                legacyLine

                  .offerDiscount

              )

            );



          const oldAutomaticDiscount =

            roundMoney(

              legacyLine

                .automaticDiscount

            );



          const oldAutomaticBase =

            roundMoney(

              Math.max(

                0,

                lineSubtotal -

                  oldOfferDiscount

              )

            );



          let automaticDiscount =

            0;



          if (

            oldAutomaticDiscount >

              0 &&

            oldAutomaticBase >

              0 &&

            afterOffer >

              0

          ) {

            automaticDiscount =

              roundMoney(

                oldAutomaticDiscount *

                  (

                    afterOffer /

                    oldAutomaticBase

                  )

              );



            automaticDiscount =

              Math.min(

                afterOffer,

                automaticDiscount

              );

          }



          const afterAutomatic =

            roundMoney(

              afterOffer -

                automaticDiscount

            );



          /* -----------------------------------------------

             COUPON / DISCOUNT CODE



             Same scaling logic:

             preserve existing coupon eligibility/rule,

             but apply it after the correct offer and

             automatic discount.

          ----------------------------------------------- */



          const oldCodeDiscount =

            roundMoney(

              legacyLine

                .codeDiscount

            );



          const oldCodeBase =

            roundMoney(

              Math.max(

                0,

                oldAutomaticBase -

                  oldAutomaticDiscount

              )

            );



          let codeDiscount =

            0;



          if (

            oldCodeDiscount >

              0 &&

            oldCodeBase >

              0 &&

            afterAutomatic >

              0

          ) {

            codeDiscount =

              roundMoney(

                oldCodeDiscount *

                  (

                    afterAutomatic /

                    oldCodeBase

                  )

              );



            codeDiscount =

              Math.min(

                afterAutomatic,

                codeDiscount

              );

          }



          const totalDiscount =

            roundMoney(

              offerDiscount +

                automaticDiscount +

                codeDiscount

            );



          const finalLineTotal =

            roundMoney(

              Math.max(

                0,

                lineSubtotal -

                  totalDiscount

              )

            );



          const offerMeta =

            offerPricing

              .offerMetaByLine

              .get(

                lineId

              );



          const discount = {

            lineId,



            productId,



            offerId:

              offerMeta

                ?.offerId ||

              null,



            offerName:

              offerMeta

                ?.offerName ||

              "",



            offerType:

              offerMeta

                ?.offerType ||

              null,



            offerDiscount,



            automaticValueType:

              legacyLine

                .automaticValueType ||

              legacyDiscountResult

                ?.automatic

                ?.valueType ||

              "percentage",



            automaticPercentage:

              Number(

                legacyLine

                  .automaticPercentage ??

                legacyDiscountResult

                  ?.automatic

                  ?.percentage ??

                0

              ),



            automaticDiscount,



            codeValueType:

              legacyLine

                .codeValueType ||

              legacyDiscountResult

                ?.code

                ?.valueType ||

              "percentage",



            codePercentage:

              Number(

                legacyLine

                  .codePercentage ??

                legacyDiscountResult

                  ?.code

                  ?.percentage ??

                0

              ),



            codeDiscount,



            totalDiscount,



            finalLineTotal,

          };



          return {

            ...item,



            discount,

          };

        }

      );



    /* =======================================================

       CART DISCOUNT TOTALS

    ======================================================= */



    const offerDiscount =

      roundMoney(

        discountedItems.reduce(

          (

            total:

              number,

            item:

              any

          ) =>

            total +

            Number(

              item.discount

                ?.offerDiscount ||

                0

            ),

          0

        )

      );



    const automaticDiscount =

      roundMoney(

        discountedItems.reduce(

          (

            total:

              number,

            item:

              any

          ) =>

            total +

            Number(

              item.discount

                ?.automaticDiscount ||

                0

            ),

          0

        )

      );



    const codeDiscount =

      roundMoney(

        discountedItems.reduce(

          (

            total:

              number,

            item:

              any

          ) =>

            total +

            Number(

              item.discount

                ?.codeDiscount ||

                0

            ),

          0

        )

      );



    const totalDiscount =

      roundMoney(

        offerDiscount +

          automaticDiscount +

          codeDiscount

      );



    const discountedSubtotal =

      roundMoney(

        Math.max(

          0,

          subtotal -

            totalDiscount

        )

      );



    /* =======================================================

       TAX



       Tax is calculated on the actual final discounted

       line totals.

    ======================================================= */



    const taxResult =

      await calculateTax(

        discountedItems

          .filter(

            (

              item:

                any

            ) =>

              item.available &&

              item.product?._id

          )

          .map(

            (

              item:

                any

            ) => ({

              productId:

                String(

                  item.product._id

                ),



              amount:

                Number(

                  item.discount

                    ?.finalLineTotal ??

                    item.subtotal ??

                    0

                ),

            })

          )

      );



    const total =

      roundMoney(

        Math.max(

          0,

          discountedSubtotal +

            Number(

              taxResult.amount ||

                0

            )

        )

      );



    /* =======================================================

       CORRECT DISCOUNT SUMMARIES

    ======================================================= */



    const automaticSummary = {

      ...(

        legacyDiscountResult

          ?.automatic ||

        {}

      ),



      baseAmount:

        roundMoney(

          Math.max(

            0,

            subtotal -

              offerDiscount

          )

        ),



      amount:

        automaticDiscount,

    };



    const codeSummary =

      legacyDiscountResult

        ?.code

        ? {

            ...legacyDiscountResult.code,



            baseAmount:

              roundMoney(

                Math.max(

                  0,

                  subtotal -

                    offerDiscount -

                    automaticDiscount

                )

              ),



            amount:

              codeDiscount,

          }

        : null;

    /* =======================================================
       AVAILABLE DISCOUNT CODES

       Dynamic:
       - database/admin se aayenge
       - hardcoded coupon nahi
       - sirf active + currently valid date range wale codes

       Final cart/product eligibility apply time par existing
       applyCartDiscountCode() verify karega.
    ======================================================= */

    const currentDate =
      new Date();

    const availableDiscountCodeDocs =
      await DiscountCode.find({
        isActive:
          true,

        $and: [
          {
            $or: [
              {
                startsAt: {
                  $exists:
                    false,
                },
              },
              {
                startsAt:
                  null,
              },
              {
                startsAt: {
                  $lte:
                    currentDate,
                },
              },
            ],
          },
          {
            $or: [
              {
                endsAt: {
                  $exists:
                    false,
                },
              },
              {
                endsAt:
                  null,
              },
              {
                endsAt: {
                  $gte:
                    currentDate,
                },
              },
            ],
          },
        ],
      })
        .select(
          "_id code startsAt endsAt"
        )
        .sort({
          createdAt:
            -1,
        })
        .limit(
          5
        )
        .lean();

    const availableDiscountCodes =
      availableDiscountCodeDocs
        .map(
          (
            coupon:
              any
          ) => ({
            _id:
              String(
                coupon._id
              ),

            code:
              String(
                coupon.code ||
                  ""
              )
                .trim()
                .toUpperCase(),

            startsAt:
              coupon.startsAt ||
              null,

            endsAt:
              coupon.endsAt ||
              null,
          })
        )
        .filter(
          (
            coupon:
              any
          ) =>
            Boolean(
              coupon.code
            )
        );





    /* =======================================================

       FINAL CART RESPONSE

    ======================================================= */



    return {

      _id:

        cart._id,



      user:

        cart.user,



      items:

        discountedItems,



      totalItems,



      subtotal,



      offerDiscount,



      automaticDiscount,



      codeDiscount,



      discount:

        totalDiscount,



      discountSummary: {

        /*

         * DO NOT use legacyDiscountResult.offers here.

         *

         * This is the actual fix for the wrong global

         * "Buy 3 Get 1 Free" showing on fixed bundle lines.

         */

        offers: {

          active:

            offerPricing

              .applied

              .length >

            0,



          amount:

            offerDiscount,



          applied:

            offerPricing

              .applied,

        },



        automatic:

          automaticSummary,



        code:

          codeSummary,

      },



      /*

       * Frontend cart can show:

       * 1/4 -> Add 3 more

       * 2/4 -> Add 2 more

       * 3/4 -> Add 1 more

       * 4/4 -> Offer unlocked

       */

      offerProgress:

        offerPricing

          .progress,



      appliedDiscountCode:

        cart.discountCode ||

        "",



      availableDiscountCodes,



      taxableAmount:

        taxResult

          .taxableAmount,



      tax:

        taxResult.amount,



      taxSummary:

        taxResult,



      total,



      createdAt:

        cart.createdAt,



      updatedAt:

        cart.updatedAt,

    };



  };







/* =========================================================



   ADD ITEM



========================================================= */



export const addItemToCart =



  async (



    userId: string,



    data: AddCartItemData



  ) => {



    validateObjectId(



      userId,



      "user ID"



    );



    validateObjectId(



      data.productId,



      "product ID"



    );



    validateObjectId(



      data.colorId,



      "color ID"



    );



    validateObjectId(



      data.sizeId,



      "size ID"



    );



    const quantity =



      normalizeQuantity(



        data.quantity,



        1



      );



    const {



      offerId,



      offerType,



      offerSource,



    } =



      normalizeOfferContext(



        data.offerContext



      );



    const product =



      await Product.findById(



        data.productId



      );



    if (!product) {



      throw new Error(



        "Product not found."



      );



    }



    if (



      (product as any).isActive === false



    ) {



      throw new Error(



        "Product is not available for purchase."



      );



    }



    const {



      size,



    } = getVariant(



      product,



      data.colorId,



      data.sizeId



    );



    const cart =



      await getOrCreateCart(



        userId



      );



    const existingItem =



      cart.items.find(



        item =>



          String(



            item.product



          ) ===



            data.productId &&



          String(



            item.colorId



          ) ===



            data.colorId &&



          String(



            item.sizeId



          ) ===



            data.sizeId &&



          String(



            item.offerId ||



              ""



          ) ===



            String(



              offerId ||



                ""



            ) &&



          String(



            item.offerType ||



              ""



          ) ===



            String(



              offerType ||



                ""



            ) &&



          String(



            item.offerSource ||



              ""



          ) ===



            String(



              offerSource ||



                ""



            )



      );



    const nextQuantity =



      existingItem



        ? existingItem.quantity +



          quantity



        : quantity;



    if (



      nextQuantity > 99



    ) {



      throw new Error(



        "Maximum cart quantity is 99."



      );



    }



    const availableStock =



      getAvailableStock(



        product,



        size



      );



    if (



      availableStock <



      nextQuantity



    ) {



      throw new Error(



        `Only ${availableStock} item(s) are available in stock.`



      );



    }



    const now = new Date();



    let trackingAddedAt = now;



    if (existingItem) {



      existingItem.quantity =



        nextQuantity;



      existingItem.updatedAt =



        now;



      trackingAddedAt = existingItem.addedAt || now;



    } else {



      cart.items.push({



        product:



          new Types.ObjectId(



            data.productId



          ),



        colorId:



          new Types.ObjectId(



            data.colorId



          ),



        sizeId:



          new Types.ObjectId(



            data.sizeId



          ),



        quantity,



        offerId,



        offerType,



        offerSource,



        addedAt:



          now,



        updatedAt:



          now,



      });



    }



    await cart.save();



    const activity = await trackUserActivity({



      userId,



      type: "cart_add",



      productId: data.productId,



      metadata: {



        colorId: data.colorId,



        sizeId: data.sizeId,



        quantity,



        finalQuantity: nextQuantity,



        addedAt: trackingAddedAt,



        offerId:



          offerId



            ? String(



                offerId



              )



            : "",



        offerType,



        offerSource,



      },



    });



    const response = await buildCartResponse(



      cart



    );



    void sendCartAddedEmail({



      userId,



      productId: data.productId,



      colorId: data.colorId,



      sizeId: data.sizeId,



      quantity: nextQuantity,



      cartTotal: Number((response as any).total || 0),



    })



      .then((sent) => {



        if (sent && activity?._id) {



          return markActivityEmailSent(String(activity._id));



        }



      })



      .catch((error) => console.error("CART ADDED EMAIL ERROR:", error));



    return response;



  };



/* =========================================================



   GET CART



========================================================= */



export const getUserCart =



  async (



    userId: string



  ) => {



    validateObjectId(



      userId,



      "user ID"



    );



    const cart =



      await getOrCreateCart(



        userId



      );



    return buildCartResponse(



      cart



    );



  };



/* =========================================================



   GET CART COUNT



========================================================= */



export const getCartCount =



  async (



    userId: string



  ) => {



    validateObjectId(



      userId,



      "user ID"



    );



    const cart =



      await Cart.findOne({



        user: userId,



      });



    if (!cart) {



      return 0;



    }



    return cart.items.reduce(



      (



        total,



        item



      ) =>



        total +



        item.quantity,



      0



    );



  };



/* =========================================================



   UPDATE ITEM QUANTITY



========================================================= */



export const updateCartItem =



  async (



    userId: string,



    cartItemId: string,



    data: UpdateCartItemData



  ) => {



    validateObjectId(



      userId,



      "user ID"



    );



    validateObjectId(



      cartItemId,



      "cart item ID"



    );



    const quantity =



      normalizeQuantity(



        data.quantity



      );



    const cart =



      await Cart.findOne({



        user: userId,



      });



    if (!cart) {



      throw new Error(



        "Cart not found."



      );



    }



    const item =



      cart.items.find(



        value =>



          String(



            value._id



          ) ===



          cartItemId



      );



    if (!item) {



      throw new Error(



        "Cart item not found."



      );



    }



    const product =



      await Product.findById(



        item.product



      );



    if (!product) {



      throw new Error(



        "Product not found."



      );



    }



    if (



      (product as any).isActive === false



    ) {



      throw new Error(



        "Product is not available for purchase."



      );



    }



    const {



      size,



    } = getVariant(



      product,



      String(



        item.colorId



      ),



      String(



        item.sizeId



      )



    );



    const availableStock =



      getAvailableStock(



        product,



        size



      );



    if (



      availableStock <



      quantity



    ) {



      throw new Error(



        `Only ${availableStock} item(s) are available in stock.`



      );



    }



    const previousQuantity = Number(item.quantity || 0);



    item.quantity =



      quantity;



    item.updatedAt =



      new Date();



    await cart.save();



    await trackUserActivity({



      userId,



      type: "cart_update",



      productId: String(item.product),



      metadata: {



        colorId: String(item.colorId),



        sizeId: String(item.sizeId),



        previousQuantity,



        quantity,



      },



    });



    return buildCartResponse(



      cart



    );



  };



/* =========================================================



   REMOVE ONE CART ITEM



========================================================= */



export const removeCartItem =



  async (



    userId: string,



    cartItemId: string



  ) => {



    validateObjectId(



      userId,



      "user ID"



    );



    validateObjectId(



      cartItemId,



      "cart item ID"



    );



    const cart =



      await Cart.findOne({



        user: userId,



      });



    if (!cart) {



      throw new Error(



        "Cart not found."



      );



    }



    const removedItem =



      cart.items.find(



        item =>



          String(



            item._id



          ) ===



          cartItemId



      );



    const itemExists = Boolean(removedItem);



    if (!itemExists) {



      throw new Error(



        "Cart item not found."



      );



    }



    cart.items =



      cart.items.filter(



        item =>



          String(



            item._id



          ) !==



          cartItemId



      );



    await cart.save();



    if (removedItem) {



      await trackUserActivity({



        userId,



        type: "cart_remove",



        productId: String(removedItem.product),



        metadata: {



          colorId: String(removedItem.colorId),



          sizeId: String(removedItem.sizeId),



          quantity: Number(removedItem.quantity || 0),



          addedAt: removedItem.addedAt,



        },



      });



    }



    return buildCartResponse(



      cart



    );



  };



/* =========================================================



   CLEAR CART



========================================================= */



export const clearUserCart =



  async (



    userId: string



  ) => {



    validateObjectId(



      userId,



      "user ID"



    );



    const cart =



      await getOrCreateCart(



        userId



      );



    const clearedItems = cart.items.length;



    cart.items = [];



    cart.discountCode = "";



    await cart.save();



    if (clearedItems > 0) {



      await trackUserActivity({



        userId,



        type: "cart_clear",



        metadata: { clearedItems },



      });



    }



    return buildCartResponse(



      cart



    );



  };



/* =========================================================



   DISCOUNT CODE



========================================================= */



export const applyCartDiscountCode = async (userId: string, rawCode: string) => {



  validateObjectId(userId, "user ID");



  const code = String(rawCode || "").trim().toUpperCase();



  if (!code) throw new Error("Enter a discount code.");



  const coupon = await DiscountCode.findOne({ code, isActive: true }).lean();



  if (!coupon) throw new Error("Discount code is invalid or inactive.");



  const now = new Date();



  if (coupon.startsAt && new Date(coupon.startsAt) > now) throw new Error("Discount code is not active yet.");



  if (coupon.endsAt && new Date(coupon.endsAt) < now) throw new Error("Discount code has expired.");



  const cart = await getOrCreateCart(userId);



  cart.discountCode = code;



  await cart.save();



  const response = await buildCartResponse(cart);



  if (response.codeDiscount <= 0) {



    cart.discountCode = "";



    await cart.save();



    throw new Error("This discount code is not valid for products in your cart.");



  }



  return response;



};



export const removeCartDiscountCode = async (userId: string) => {



  validateObjectId(userId, "user ID");



  const cart = await getOrCreateCart(userId);



  cart.discountCode = "";



  await cart.save();



  return buildCartResponse(cart);



};
